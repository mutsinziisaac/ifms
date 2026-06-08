// Live simulation engine. A single setInterval drives the whole fleet: every
// real-time tick advances moving vehicles along their routes, rolls status
// transitions, evaluates geofencing rules and emits alerts — all inside ONE
// store.mutate so consumers re-render once per tick.

import { qk } from "@/data/query-keys"
import { mutate } from "@/data/store"
import type {
  Alert,
  AlertRule,
  DB,
  Geozone,
  RouteDef,
  Vehicle,
} from "@/data/types"
import { queryClient } from "@/lib/query-client"
import { interpolateAlongPath, isInsideGeozone } from "@/lib/maps"

const TICK_MS = 1500
// At 1x: 1.5 real s * 1 * 40 = 60 simulated seconds per tick.
const SIM_SECONDS_PER_REAL_SECOND = 40
const MAX_ALERTS = 200
const SPEEDING_THROTTLE_WINDOW = 50

export interface SimulationHandle {
  stop: () => void
  setSpeed: (multiplier: number) => void
  setPaused: (paused: boolean) => void
}

let simIdCounter = 0
const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"

function nextAlertId(): string {
  simIdCounter++
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  }
  return `alr-${suffix}${(Date.now() + simIdCounter).toString(36).slice(-2)}`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
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
      const newAlerts: Alert[] = []

      db.vehicles = db.vehicles.map((vehicle) =>
        tickVehicle(db, vehicle, routesById, simElapsedHours, now, newAlerts)
      )

      if (newAlerts.length > 0) {
        db.alerts.unshift(...newAlerts)
        if (db.alerts.length > MAX_ALERTS) {
          db.alerts.length = MAX_ALERTS
        }
      }
    })

    queryClient.invalidateQueries({ queryKey: qk.vehicles })
    queryClient.invalidateQueries({ queryKey: qk.alerts })
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
  newAlerts: Alert[]
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
    return v
  }

  // --- idling / ignition_off: parked ---
  if (v.status === "idling" || v.status === "ignition_off") {
    v.speedKmh = 0
    v.lastSyncAt = now
    // Re-evaluate geofencing (it sits still, but rules may have changed).
    applyGeofencing(db, prev, v, now, newAlerts)
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

  applyGeofencing(db, prev, v, now, newAlerts)

  return v
}

// ---------------------------------------------------------------------------
// Geofencing — entry/exit/speeding alert generation.
// ---------------------------------------------------------------------------

function applyGeofencing(
  db: DB,
  prev: Vehicle,
  v: Vehicle,
  now: string,
  newAlerts: Alert[]
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
      const exitRule = findActiveRule(db.alertRules, oldInsideId, "exit")
      if (oldZone && exitRule) {
        newAlerts.push({
          id: nextAlertId(),
          type: "exit",
          severity: "info",
          vehicleId: v.id,
          vehiclePlate: v.plate,
          geozoneId: oldZone.id,
          geozoneName: oldZone.name,
          message: `${v.plate} exited ${oldZone.name}`,
          at: now,
          location: { ...v.position },
          read: false,
        })
      }
    }
    // Entered the new zone.
    if (newInsideId !== null && newInsideZone) {
      const entryRule = findActiveRule(db.alertRules, newInsideId, "entry")
      if (entryRule) {
        newAlerts.push({
          id: nextAlertId(),
          type: "entry",
          severity: "info",
          vehicleId: v.id,
          vehiclePlate: v.plate,
          geozoneId: newInsideZone.id,
          geozoneName: newInsideZone.name,
          message: `${v.plate} entered ${newInsideZone.name}`,
          at: now,
          location: { ...v.position },
          read: false,
        })
      }
    }
  }

  v.insideGeozoneId = newInsideId

  // Speeding — while inside a zone with an active speeding rule.
  if (newInsideId !== null && newInsideZone) {
    const speedRule = findActiveRule(db.alertRules, newInsideId, "speeding")
    if (
      speedRule &&
      speedRule.speedLimitKmh !== null &&
      v.speedKmh > speedRule.speedLimitKmh
    ) {
      const limit = speedRule.speedLimitKmh
      // Throttle: skip if a speeding alert already exists for this
      // vehicle+zone among the 50 newest alerts (including this tick's).
      const recentExisting = db.alerts
        .slice(0, SPEEDING_THROTTLE_WINDOW)
        .some(
          (a) =>
            a.type === "speeding" &&
            a.vehicleId === v.id &&
            a.geozoneId === newInsideId
        )
      const pendingThisTick = newAlerts.some(
        (a) =>
          a.type === "speeding" &&
          a.vehicleId === v.id &&
          a.geozoneId === newInsideId
      )
      if (!recentExisting && !pendingThisTick) {
        const speed = Math.round(v.speedKmh)
        newAlerts.push({
          id: nextAlertId(),
          type: "speeding",
          severity: speed > limit + 25 ? "critical" : "warning",
          vehicleId: v.id,
          vehiclePlate: v.plate,
          geozoneId: newInsideZone.id,
          geozoneName: newInsideZone.name,
          message: `${v.plate} exceeded ${limit} km/h in ${newInsideZone.name} (${speed} km/h)`,
          at: now,
          location: { ...v.position },
          read: false,
        })
      }
    }
  }
}

function findActiveRule(
  rules: AlertRule[],
  geozoneId: string,
  type: AlertRule["type"]
): AlertRule | undefined {
  return rules.find(
    (r) => r.geozoneId === geozoneId && r.type === type && r.active
  )
}
