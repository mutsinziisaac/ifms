// Live simulation engine. A single setInterval drives the whole fleet: every
// real-time tick advances moving vehicles along their routes, rolls status
// transitions, evaluates event rules (geofencing + fleet-wide) and emits
// events — all inside ONE store.mutate so consumers re-render once per tick.

import { qk } from "@/data/query-keys"
import { mutate } from "@/data/store"
import type {
  DB,
  EventRule,
  EventRuleType,
  FleetEvent,
  Geozone,
  RouteDef,
  Vehicle,
  ZoneRuleType,
} from "@/data/types"
import { queryClient } from "@/lib/query-client"
import {
  distanceToPolylineMeters,
  interpolateAlongPath,
  isInsideGeozone,
  offsetLatLng,
} from "@/lib/maps"

const TICK_MS = 1500
// At 1x: 1.5 real s * 1 * 40 = 60 simulated seconds per tick.
const SIM_SECONDS_PER_REAL_SECOND = 40
const MAX_EVENTS = 200
const SPEEDING_THROTTLE_WINDOW = 50
const TELEMETRY_HISTORY_MAX = 40
const MIN_MS = 60 * 1000

export interface SimulationHandle {
  stop: () => void
  setSpeed: (multiplier: number) => void
  setPaused: (paused: boolean) => void
}

let simIdCounter = 0
const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"

function nextEventId(): string {
  simIdCounter++
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  }
  return `evt-${suffix}${(Date.now() + simIdCounter).toString(36).slice(-2)}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function newEvent(
  v: Vehicle,
  type: FleetEvent["type"],
  severity: FleetEvent["severity"],
  zone: Geozone | null,
  message: string,
  now: string,
  route: RouteDef | null = null
): FleetEvent {
  return {
    id: nextEventId(),
    type,
    severity,
    vehicleId: v.id,
    vehiclePlate: v.plate,
    entityId: v.entityId,
    geozoneId: zone?.id ?? null,
    geozoneName: zone?.name ?? null,
    routeId: route?.id ?? null,
    routeName: route?.name ?? null,
    message,
    at: now,
    location: { ...v.position },
    read: false,
    status: "open",
    acknowledgedBy: null,
    acknowledgedAt: null,
    escalatedTo: null,
    escalatedAt: null,
    closedBy: null,
    closedAt: null,
    resolutionNote: null,
  }
}

/** A trigger watches a vehicle when it is unscoped or names it explicitly. */
function ruleAppliesTo(rule: EventRule, vehicleId: string): boolean {
  return rule.vehicleIds === null || rule.vehicleIds.includes(vehicleId)
}

/**
 * The active fleet-wide rule of `type` that governs this vehicle. A
 * vehicle-scoped rule wins over the unscoped fleet-wide one, so a vehicle only
 * ever fires a single rule of each type.
 */
function globalRuleFor(
  db: DB,
  type: EventRuleType,
  vehicleId: string
): EventRule | undefined {
  let fleet: EventRule | undefined
  for (const r of db.eventRules) {
    if (r.type !== type || !r.active) continue
    if (r.vehicleIds !== null) {
      if (r.vehicleIds.includes(vehicleId)) return r
    } else {
      fleet = r
    }
  }
  return fleet
}

export function startSimulation(): SimulationHandle {
  let speedMultiplier = 4
  let paused = false

  const interval = setInterval(() => {
    if (paused) return
    const simElapsedSeconds =
      (TICK_MS / 1000) * speedMultiplier * SIM_SECONDS_PER_REAL_SECOND
    const simElapsedHours = simElapsedSeconds / 3600
    const now = new Date().toISOString()

    mutate((db) => {
      const routesById = new Map<string, RouteDef>(
        db.routes.map((r) => [r.id, r])
      )
      const newEvents: FleetEvent[] = []

      db.vehicles = db.vehicles.map((vehicle) =>
        tickVehicle(db, vehicle, routesById, simElapsedHours, now, newEvents)
      )

      if (newEvents.length > 0) {
        db.events.unshift(...newEvents)
        if (db.events.length > MAX_EVENTS) {
          db.events.length = MAX_EVENTS
        }
      }

      // Provider telemetry — count devices that synced this tick per entity.
      const syncedByEntity = new Map<string, number>()
      for (const v of db.vehicles) {
        if (v.lastSyncAt === now) {
          syncedByEntity.set(
            v.entityId,
            (syncedByEntity.get(v.entityId) ?? 0) + 1
          )
        }
      }
      for (const t of db.providerTelemetry) {
        const sample = syncedByEntity.get(t.entityId) ?? 0
        t.messagesTotal += sample
        t.history = [...t.history.slice(-(TELEMETRY_HISTORY_MAX - 1)), sample]
      }
    })

    queryClient.invalidateQueries({ queryKey: qk.vehicles })
    queryClient.invalidateQueries({ queryKey: qk.events })
  }, TICK_MS)

  return {
    stop: () => clearInterval(interval),
    setSpeed: (multiplier: number) => {
      speedMultiplier = multiplier
    },
    setPaused: (value: boolean) => {
      paused = value
    },
  }
}

// ---------------------------------------------------------------------------
// Per-vehicle tick — returns a NEW vehicle object (immutable replace) so
// memoized map markers update.
// ---------------------------------------------------------------------------

function tickVehicle(
  db: DB,
  prev: Vehicle,
  routesById: Map<string, RouteDef>,
  simElapsedHours: number,
  now: string,
  newEvents: FleetEvent[]
): Vehicle {
  // Ignition-blocked vehicles never auto-change anything.
  if (prev.status === "ignition_blocked") {
    return prev
  }

  const v: Vehicle = { ...prev }

  // --- status transitions (per-tick probabilities) ---
  const roll = Math.random()
  switch (v.status) {
    case "moving":
      if (roll < 0.015) v.status = "idling"
      else if (roll < 0.015 + 0.003) v.status = "no_signal"
      break
    case "idling":
      if (roll < 0.12) v.status = "moving"
      else if (roll < 0.12 + 0.003) v.status = "no_signal"
      break
    case "ignition_off":
      if (roll < 0.01 && v.routeId !== null) v.status = "moving"
      break
    case "no_signal":
      if (roll < 0.06) v.status = "moving"
      break
  }
  if (v.status !== prev.status) {
    v.statusSince = now
  }

  // --- no_signal: freeze position and lastSyncAt entirely ---
  if (v.status === "no_signal") {
    v.speedKmh = 0
    applyNoSignalRule(db, v, globalRuleFor(db, "no_signal", v.id), now, newEvents)
    return v
  }

  // --- idling / ignition_off: parked ---
  if (v.status === "idling" || v.status === "ignition_off") {
    v.speedKmh = 0
    v.lastSyncAt = now
    // Re-evaluate geofencing (it sits still, but rules may have changed).
    applyGeofencing(db, prev, v, now, newEvents)
    if (v.status === "idling") {
      applyIdleRule(db, v, globalRuleFor(db, "idle", v.id), now, newEvents)
    }
    return v
  }

  // --- moving ---
  const route = v.routeId !== null ? routesById.get(v.routeId) : undefined
  const hasActiveRoute =
    route !== undefined && route.active && route.path.length >= 2

  // jitter speed by ±6 within 45..90 (clamp lifts freshly-started vehicles,
  // whose parked speed is 0, up to the 45 km/h floor)
  v.speedKmh = clamp(v.speedKmh + (Math.random() * 12 - 6), 45, 90)

  const distanceKm = v.speedKmh * simElapsedHours

  if (hasActiveRoute && route) {
    const delta = distanceKm / Math.max(1, route.distanceKm)
    let progress = v.routeProgress + delta * v.routeDir
    let dir = v.routeDir
    if (progress >= 1) {
      progress = 1
      dir = -1
    } else if (progress <= 0) {
      progress = 0
      dir = 1
    }
    v.routeProgress = progress
    v.routeDir = dir
    const { position, heading } = interpolateAlongPath(route.path, progress)
    v.position = position
    v.heading = heading

    // Occasionally send a vehicle off-corridor so route-deviation triggers can
    // fire; while an excursion runs we offset the on-route position laterally.
    const excursion = excursions.get(v.id) ?? maybeStartExcursion(v.id)
    if (excursion) {
      excursion.ticksLeft--
      const bearing = (v.heading + excursion.sideDeg + 360) % 360
      v.position = offsetLatLng(v.position, bearing, excursion.meters)
      if (!excursion.fired && applyRouteDeviation(db, v, route, now, newEvents)) {
        excursion.fired = true
      }
      if (excursion.ticksLeft <= 0) excursions.delete(v.id)
    }
  } else {
    // random walk around current position
    v.position = {
      lat: v.position.lat + (Math.random() * 0.008 - 0.004),
      lng: v.position.lng + (Math.random() * 0.008 - 0.004),
    }
    v.heading = (v.heading + (Math.random() * 40 - 20) + 360) % 360
  }

  v.odometerKm = v.odometerKm + distanceKm
  v.fuelPct = v.fuelPct - distanceKm * 0.02
  if (v.fuelPct < 8) v.fuelPct = 95
  v.lastSyncAt = now

  applyGeofencing(db, prev, v, now, newEvents)
  applyGlobalSpeeding(
    db,
    v,
    globalRuleFor(db, "global_speeding", v.id),
    now,
    newEvents
  )

  return v
}

// ---------------------------------------------------------------------------
// Route-deviation excursions — transient off-corridor episodes kept in a
// module-level map (no need to pollute the Vehicle domain type).
// ---------------------------------------------------------------------------

interface Excursion {
  ticksLeft: number
  /** Perpendicular side relative to heading: +90 or -90 degrees */
  sideDeg: number
  meters: number
  fired: boolean
}

const excursions = new Map<string, Excursion>()
const EXCURSION_START_PROB = 0.003

function maybeStartExcursion(vehicleId: string): Excursion | undefined {
  if (Math.random() >= EXCURSION_START_PROB) return undefined
  const excursion: Excursion = {
    ticksLeft: 4 + Math.floor(Math.random() * 5), // 4..8 ticks
    sideDeg: Math.random() < 0.5 ? 90 : -90,
    meters: 900 + Math.random() * 900, // 900..1800 m off the corridor
    fired: false,
  }
  excursions.set(vehicleId, excursion)
  return excursion
}

function applyRouteDeviation(
  db: DB,
  v: Vehicle,
  route: RouteDef,
  now: string,
  newEvents: FleetEvent[]
): boolean {
  const rule = db.eventRules.find(
    (r) =>
      r.type === "route_deviation" &&
      r.active &&
      r.routeId === route.id &&
      ruleAppliesTo(r, v.id)
  )
  if (!rule || rule.deviationMeters === null) return false
  const dist = distanceToPolylineMeters(v.position, route.path)
  if (dist < rule.deviationMeters) return false
  const m = Math.round(dist)
  newEvents.push(
    newEvent(
      v,
      "route_deviation",
      dist > rule.deviationMeters * 2 ? "critical" : rule.severity,
      null,
      `${v.plate} deviated ${m} m off ${route.name}`,
      now,
      route
    )
  )
  return true
}

// ---------------------------------------------------------------------------
// Geofencing — entry/exit/speeding event generation.
// ---------------------------------------------------------------------------

function applyGeofencing(
  db: DB,
  prev: Vehicle,
  v: Vehicle,
  now: string,
  newEvents: FleetEvent[]
): void {
  let newInsideId: string | null = null
  let newInsideZone: Geozone | undefined
  for (const zone of db.geozones) {
    if (isInsideGeozone(v.position, zone)) {
      newInsideId = zone.id
      newInsideZone = zone
      break
    }
  }

  const oldInsideId = prev.insideGeozoneId

  if (newInsideId !== oldInsideId) {
    // Exited the old zone.
    if (oldInsideId !== null) {
      const oldZone = db.geozones.find((z) => z.id === oldInsideId)
      const exitRule = findActiveZoneRule(
        db.eventRules,
        oldInsideId,
        "exit",
        v.id
      )
      if (oldZone && exitRule) {
        newEvents.push(
          newEvent(
            v,
            "exit",
            exitRule.severity,
            oldZone,
            `${v.plate} exited ${oldZone.name}`,
            now
          )
        )
      }
    }
    // Entered the new zone.
    if (newInsideId !== null && newInsideZone) {
      const entryRule = findActiveZoneRule(
        db.eventRules,
        newInsideId,
        "entry",
        v.id
      )
      if (entryRule) {
        newEvents.push(
          newEvent(
            v,
            "entry",
            entryRule.severity,
            newInsideZone,
            `${v.plate} entered ${newInsideZone.name}`,
            now
          )
        )
      }
    }
  }

  v.insideGeozoneId = newInsideId

  // Speeding — while inside a zone with an active speeding rule.
  if (newInsideId !== null && newInsideZone) {
    const speedRule = findActiveZoneRule(
      db.eventRules,
      newInsideId,
      "speeding",
      v.id
    )
    if (
      speedRule &&
      speedRule.speedLimitKmh !== null &&
      v.speedKmh > speedRule.speedLimitKmh
    ) {
      const limit = speedRule.speedLimitKmh
      if (!speedingAlreadyReported(db, newEvents, v.id, newInsideId)) {
        const speed = Math.round(v.speedKmh)
        newEvents.push(
          newEvent(
            v,
            "speeding",
            speed > limit + 25 ? "critical" : speedRule.severity,
            newInsideZone,
            `${v.plate} exceeded ${limit} km/h in ${newInsideZone.name} (${speed} km/h)`,
            now
          )
        )
      }
    }
  }
}

// Throttle: skip if a speeding event already exists for this vehicle+zone
// (zone null = fleet-wide) among the newest events, including this tick's.
function speedingAlreadyReported(
  db: DB,
  pending: FleetEvent[],
  vehicleId: string,
  geozoneId: string | null
): boolean {
  const matches = (e: FleetEvent) =>
    e.type === "speeding" &&
    e.vehicleId === vehicleId &&
    e.geozoneId === geozoneId
  return (
    db.events.slice(0, SPEEDING_THROTTLE_WINDOW).some(matches) ||
    pending.some(matches)
  )
}

// ---------------------------------------------------------------------------
// Fleet-wide rules — global speeding, excessive idle, signal timeout.
// ---------------------------------------------------------------------------

function applyGlobalSpeeding(
  db: DB,
  v: Vehicle,
  rule: EventRule | undefined,
  now: string,
  newEvents: FleetEvent[]
): void {
  if (!rule || rule.speedLimitKmh === null) return
  if (v.speedKmh <= rule.speedLimitKmh) return
  // A zone speeding rule covering the current zone wins — avoid double-fire.
  if (
    v.insideGeozoneId !== null &&
    findActiveZoneRule(db.eventRules, v.insideGeozoneId, "speeding", v.id)
  ) {
    return
  }
  if (speedingAlreadyReported(db, newEvents, v.id, null)) return
  const speed = Math.round(v.speedKmh)
  newEvents.push(
    newEvent(
      v,
      "speeding",
      speed > rule.speedLimitKmh + 25 ? "critical" : rule.severity,
      null,
      `${v.plate} exceeded the fleet speed limit of ${rule.speedLimitKmh} km/h (${speed} km/h)`,
      now
    )
  )
}

// Fire once per episode: skip if an event of this type already exists for the
// vehicle since the episode began (db.events is capped, so the scan is cheap).
function hasEventSince(
  db: DB,
  pending: FleetEvent[],
  type: FleetEvent["type"],
  vehicleId: string,
  sinceIso: string
): boolean {
  return (
    pending.some((e) => e.type === type && e.vehicleId === vehicleId) ||
    db.events.some(
      (e) => e.type === type && e.vehicleId === vehicleId && e.at >= sinceIso
    )
  )
}

function applyIdleRule(
  db: DB,
  v: Vehicle,
  rule: EventRule | undefined,
  now: string,
  newEvents: FleetEvent[]
): void {
  if (!rule || rule.thresholdMinutes === null) return
  const idleMs = +new Date(now) - +new Date(v.statusSince)
  if (idleMs < rule.thresholdMinutes * MIN_MS) return
  if (hasEventSince(db, newEvents, "idle", v.id, v.statusSince)) return
  const idleMin = Math.round(idleMs / MIN_MS)
  newEvents.push(
    newEvent(
      v,
      "idle",
      rule.severity,
      null,
      `${v.plate} idling for ${idleMin} min (limit ${rule.thresholdMinutes} min)`,
      now
    )
  )
}

function applyNoSignalRule(
  db: DB,
  v: Vehicle,
  rule: EventRule | undefined,
  now: string,
  newEvents: FleetEvent[]
): void {
  if (!rule || rule.thresholdMinutes === null) return
  const silentMs = +new Date(now) - +new Date(v.lastSyncAt)
  if (silentMs < rule.thresholdMinutes * MIN_MS) return
  if (hasEventSince(db, newEvents, "no_signal", v.id, v.statusSince)) return
  const silentMin = Math.round(silentMs / MIN_MS)
  newEvents.push(
    newEvent(
      v,
      "no_signal",
      rule.severity,
      null,
      `${v.plate} lost GPS signal — no sync for ${silentMin} min`,
      now
    )
  )
}

function findActiveZoneRule(
  rules: EventRule[],
  geozoneId: string,
  type: ZoneRuleType,
  vehicleId: string
): EventRule | undefined {
  return rules.find(
    (r) =>
      r.geozoneId === geozoneId &&
      r.type === type &&
      r.active &&
      ruleAppliesTo(r, vehicleId)
  )
}
