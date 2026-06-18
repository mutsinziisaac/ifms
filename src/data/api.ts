// Mock API layer. Every function is async with a little artificial latency so
// the UI exercises real loading states. All writes go through store.mutate so
// the version bumps and live consumers re-render. No backend exists yet.
//
// MIGRATING TO THE REAL BACKEND (one resource at a time)
// ------------------------------------------------------
// This module is the single seam between the app and its data. Hooks
// (`src/data/hooks.ts`), query keys, and all UI call these functions and never
// care how they're implemented — so each function body can be swapped from the
// in-memory store to a real HTTP call independently, leaving everything mock
// until its endpoint is ready. The HTTP client (`src/lib/http.ts`) attaches the
// Keycloak token, unwraps the response envelope, and turns failures into
// `ApiError`. Keep the same signatures so callers don't change. For example:
//
//   import { http, getAll } from "@/lib/http"
//
//   export async function listGeozones(): Promise<Geozone[]> {
//     return getAll<Geozone>("/geozones")            // pages through, returns all
//   }
//   export async function getGeozone(id: ID): Promise<Geozone | null> {
//     return http.get<Geozone>(`/geozones/${id}`)
//   }
//   export async function createGeozone(input: GeozoneInput): Promise<Geozone> {
//     return http.post<Geozone>("/geozones", input)
//   }
//
// Notes: an empty VITE_API_BASE_URL keeps these on mock data (no requests). The
// live map hooks (useLiveVehicles/Events/ProviderTelemetry in hooks.ts) read
// the simulation-driven store directly and are NOT covered here — they need a
// separate polling/stream decision once vehicles/events go real.

import { densifyPath, nearestPlaceName } from "./geo"
import { getDB, mutate } from "./store"
import type {
  Entity,
  Provider,
  EthiopiaRegion,
  EventRule,
  EventRuleNotify,
  EventRuleType,
  EventSeverity,
  FleetEvent,
  Geozone,
  GeozoneGroup,
  GeozoneShape,
  GpsProvider,
  ID,
  ItmsVerificationStatus,
  LatLng,
  RouteDef,
  Trip,
  Vehicle,
  VehicleType,
  Waypoint,
  AccidentRecord,
  IncidentRootCause,
  IncidentSeverity,
  Permission,
  Role,
  RoleType,
  WebUser,
  WebUserStatus,
} from "./types"
import { centroidOf, isInsideGeozone, pathLengthKm } from "@/lib/maps"
import { ApiError, getAll, http } from "@/lib/http"
import {
  mapProviderResponse,
  mapVehicleMapItem,
  mapVehicleResponse,
  type ProviderResponse,
  type VehicleMapItem,
  type VehicleResponse,
} from "./mappers"

/**
 * When VITE_API_BASE_URL is set we hit the real backend; otherwise every
 * function below stays on the in-memory mock. Resources migrate to real HTTP
 * one at a time (see the note at the top of this file) — `listVehicles` is the
 * first.
 */
export const isRealApi = Boolean(import.meta.env.VITE_API_BASE_URL)

/**
 * `http.get` unwraps the standard `{ header, data }` envelope. A few endpoints
 * (e.g. /vehicles/map) return a bare `{ data: … }` with no `header`, which
 * `http.get` leaves wrapped — so peel one more `data` level when present. The
 * domain entities themselves have no top-level `data` field, so this is safe.
 */
function unwrapData<T>(body: unknown): T {
  if (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "data" in body
  ) {
    return (body as { data: T }).data
  }
  return body as T
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function latency(): Promise<void> {
  return sleep(120 + Math.random() * 160)
}

let idCounter = 0
const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789"

/** Readable id, e.g. "veh-x7k2". */
function nextId(prefix: string): ID {
  idCounter++
  const seed = (Date.now() + idCounter).toString(36)
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  }
  // mix in a deterministic bit so two ids in the same ms can't collide
  return `${prefix}-${suffix}${seed.slice(-2)}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

const ADDIS: LatLng = { lat: 9.0301, lng: 38.7468 }

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface VehicleInput {
  plate: string
  type: VehicleType
  description: string
  entityId: ID
  region: EthiopiaRegion
  gpsProvider: GpsProvider
  routeId: ID | null
}

export interface GeozoneInput {
  name: string
  shape: GeozoneShape
  center: LatLng
  radiusM: number | null
  path: LatLng[] | null
  address: string
  groupId: ID | null
  note: string
}

export interface RouteInput {
  name: string
  description: string
  waypoints: { name: string; position: LatLng }[]
  active: boolean
}

// ---------------------------------------------------------------------------
// Internal lookup helpers (operate on the live DB inside mutate)
// ---------------------------------------------------------------------------

function findVehicle(
  db: ReturnType<typeof getDB>,
  id: ID
): Vehicle | undefined {
  return db.vehicles.find((v) => v.id === id)
}

function computeInsideGeozone(
  db: ReturnType<typeof getDB>,
  position: LatLng
): ID | null {
  for (const zone of db.geozones) {
    if (isInsideGeozone(position, zone)) return zone.id
  }
  return null
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export async function listEntities(): Promise<Entity[]> {
  await latency()
  return [...getDB().entities]
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

// Always hits the live backend — providers are API-only (no mock fallback).
// `getAll` pages through PayloadArrayProviderResponse; the default page size
// returns the whole catalogue in one request.
export async function listProviders(): Promise<Provider[]> {
  const rows = await getAll<ProviderResponse>("/providers")
  return rows.map(mapProviderResponse)
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

// First resource on the real backend. `getAll` pages through
// PayloadArrayVehicleResponse; the dedicated `verification=` param matches the
// `GET /api/v1/vehicles?verification=NOT_FOUND` contract (the generic
// `filter=verification::NOT_FOUND` form is a one-line swap). The mock fallback
// filters the seed in-memory so the prototype demos the same behaviour offline.
export async function listVehicles(
  verification?: ItmsVerificationStatus
): Promise<Vehicle[]> {
  if (isRealApi) {
    const rows = await getAll<VehicleResponse>(
      "/vehicles",
      verification ? { verification } : undefined
    )
    return rows.map(mapVehicleResponse)
  }
  await latency()
  const all = getDB().vehicles
  return verification
    ? all.filter((v) => v.itmsVerificationStatus === verification)
    : [...all]
}

// The Fleet page's verification queue — vehicles flagged for ITMS review
// (GET /api/v1/vehicles?filter=verification). `getAll` pages through and the
// rows carry only catalogue fields (plate/provider/external_id/registry status/
// verification), no telemetry. Mock fallback returns the non-VERIFIED seed so
// the prototype demos the same queue offline.
export async function listVerificationVehicles(): Promise<Vehicle[]> {
  if (isRealApi) {
    const rows = await getAll<VehicleResponse>("/vehicles", {
      filter: "verification",
    })
    return rows.map(mapVehicleResponse)
  }
  await latency()
  return getDB().vehicles.filter(
    (v) => v.itmsVerificationStatus !== "VERIFIED"
  )
}

// Live map snapshot — current position + movement state + verification for the
// whole fleet (drives the map and dashboard live widgets). Mock fallback returns
// the simulation-driven store (used only when VITE_API_BASE_URL is blank).
export async function listVehiclesMap(): Promise<Vehicle[]> {
  if (isRealApi) {
    const body = await http.get<unknown>("/vehicles/map")
    const items = unwrapData<VehicleMapItem[]>(body)
    return (Array.isArray(items) ? items : []).map(mapVehicleMapItem)
  }
  await latency()
  return [...getDB().vehicles]
}

// Detail catalogue record. Writes stay on the mock until their endpoints land.
export async function getVehicle(id: ID): Promise<Vehicle | null> {
  if (isRealApi) {
    try {
      const body = await http.get<unknown>(`/vehicles/${id}`)
      return mapVehicleResponse(unwrapData<VehicleResponse>(body))
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }
  await latency()
  return getDB().vehicles.find((v) => v.id === id) ?? null
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  await latency()
  let created: Vehicle | null = null
  mutate((db) => {
    const position: LatLng = {
      lat: ADDIS.lat + randomBetween(-0.02, 0.02),
      lng: ADDIS.lng + randomBetween(-0.02, 0.02),
    }
    const now = nowIso()
    const vehicle: Vehicle = {
      id: nextId("veh"),
      plate: input.plate,
      type: input.type,
      description: input.description,
      entityId: input.entityId,
      region: input.region,
      gpsProvider: input.gpsProvider,
      status: "ignition_off",
      statusSince: now,
      position,
      heading: 0,
      speedKmh: 0,
      odometerKm: Math.round(randomBetween(30000, 150000)),
      fuelPct: Math.round(randomBetween(40, 95)),
      lastSyncAt: now,
      routeId: input.routeId,
      insideGeozoneId: computeInsideGeozone(db, position),
      createdAt: now,
      itmsVerificationStatus: "UNVERIFIED",
      routeProgress: 0,
      routeDir: 1,
    }
    db.vehicles.push(vehicle)
    created = vehicle
  })
  return created!
}

export async function updateVehicle(
  id: ID,
  patch: Partial<VehicleInput>
): Promise<Vehicle> {
  await latency()
  let updated: Vehicle | null = null
  mutate((db) => {
    const vehicle = findVehicle(db, id)
    if (!vehicle) throw new Error(`Vehicle ${id} not found`)

    if (patch.plate !== undefined) vehicle.plate = patch.plate
    if (patch.type !== undefined) vehicle.type = patch.type
    if (patch.description !== undefined) vehicle.description = patch.description
    if (patch.entityId !== undefined) vehicle.entityId = patch.entityId
    if (patch.region !== undefined) vehicle.region = patch.region
    if (patch.gpsProvider !== undefined) vehicle.gpsProvider = patch.gpsProvider

    if (patch.routeId !== undefined) {
      const sameRoute = patch.routeId === vehicle.routeId
      vehicle.routeId = patch.routeId
      if (!sameRoute) {
        vehicle.routeProgress = 0
        vehicle.routeDir = 1
      }
    }

    updated = vehicle
  })
  return updated!
}

export async function deleteVehicle(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    const vehicle = findVehicle(db, id)
    if (!vehicle) return
    db.vehicles = db.vehicles.filter((v) => v.id !== id)
  })
}

// ---------------------------------------------------------------------------
// Geozones
// ---------------------------------------------------------------------------

export async function listGeozones(): Promise<Geozone[]> {
  await latency()
  return [...getDB().geozones]
}

export async function createGeozone(input: GeozoneInput): Promise<Geozone> {
  await latency()
  let created: Geozone | null = null
  mutate((db) => {
    const zone: Geozone = {
      id: nextId("geo"),
      name: input.name,
      shape: input.shape,
      center: input.center,
      radiusM: input.radiusM,
      path: input.path,
      address: input.address,
      groupId: input.groupId,
      visible: true,
      isPOI: false,
      note: input.note,
      createdAt: nowIso(),
    }
    db.geozones.push(zone)
    created = zone
  })
  return created!
}

export async function updateGeozone(
  id: ID,
  patch: Partial<GeozoneInput>
): Promise<Geozone> {
  await latency()
  let updated: Geozone | null = null
  mutate((db) => {
    const zone = db.geozones.find((g) => g.id === id)
    if (!zone) throw new Error(`Geozone ${id} not found`)

    if (patch.name !== undefined) zone.name = patch.name
    if (patch.shape !== undefined) zone.shape = patch.shape
    if (patch.center !== undefined) zone.center = patch.center
    if (patch.radiusM !== undefined) zone.radiusM = patch.radiusM
    if (patch.path !== undefined) zone.path = patch.path
    if (patch.address !== undefined) zone.address = patch.address
    if (patch.groupId !== undefined) zone.groupId = patch.groupId
    if (patch.note !== undefined) zone.note = patch.note

    updated = zone
  })
  return updated!
}

export async function deleteGeozone(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    // Remove its zone-scoped event rules (global rules have geozoneId null).
    db.eventRules = db.eventRules.filter((r) => r.geozoneId !== id)
    // Clear insideGeozoneId references.
    for (const vehicle of db.vehicles) {
      if (vehicle.insideGeozoneId === id) vehicle.insideGeozoneId = null
    }
    // Keep historical events (do not touch db.events).
    db.geozones = db.geozones.filter((g) => g.id !== id)
  })
}

export async function importGeozones(
  zones: { name: string; points: LatLng[] }[]
): Promise<number> {
  await latency()
  let count = 0
  mutate((db) => {
    for (const { name, points } of zones) {
      const center = centroidOf(points)
      const zone: Geozone = {
        id: nextId("geo"),
        name,
        shape: "polygon",
        center,
        radiusM: null,
        path: points,
        address: nearestPlaceName(center),
        groupId: null,
        visible: true,
        isPOI: false,
        note: "Imported from CSV",
        createdAt: nowIso(),
      }
      db.geozones.push(zone)
      count++
    }
  })
  return count
}

// ---------------------------------------------------------------------------
// Geozone groups
// ---------------------------------------------------------------------------

export async function listGeozoneGroups(): Promise<GeozoneGroup[]> {
  await latency()
  return [...getDB().geozoneGroups]
}

export async function createGeozoneGroup(input: {
  name: string
  color: string
}): Promise<GeozoneGroup> {
  await latency()
  let created: GeozoneGroup | null = null
  mutate((db) => {
    const group: GeozoneGroup = {
      id: nextId("ggp"),
      name: input.name,
      color: input.color,
    }
    db.geozoneGroups.push(group)
    created = group
  })
  return created!
}

export async function updateGeozoneGroup(
  id: ID,
  patch: Partial<{ name: string; color: string }>
): Promise<GeozoneGroup> {
  await latency()
  let updated: GeozoneGroup | null = null
  mutate((db) => {
    const group = db.geozoneGroups.find((g) => g.id === id)
    if (!group) throw new Error(`Geozone group ${id} not found`)
    if (patch.name !== undefined) group.name = patch.name
    if (patch.color !== undefined) group.color = patch.color
    updated = group
  })
  return updated!
}

export async function deleteGeozoneGroup(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    // Detach member geozones from the group.
    for (const zone of db.geozones) {
      if (zone.groupId === id) zone.groupId = null
    }
    db.geozoneGroups = db.geozoneGroups.filter((g) => g.id !== id)
  })
}

// ---------------------------------------------------------------------------
// Event rules
// ---------------------------------------------------------------------------

const ZONE_SCOPED_RULE_TYPES: EventRuleType[] = ["entry", "exit", "speeding"]

export interface EventRuleInput {
  id?: ID
  name: string
  type: EventRuleType
  geozoneId: ID | null
  routeId: ID | null
  speedLimitKmh: number | null
  thresholdMinutes: number | null
  deviationMeters: number | null
  vehicleIds: ID[] | null
  severity: EventSeverity
  notify: EventRuleNotify
  active: boolean
}

export async function listEventRules(): Promise<EventRule[]> {
  await latency()
  return [...getDB().eventRules]
}

export async function upsertEventRule(
  input: EventRuleInput
): Promise<EventRule> {
  await latency()
  if (ZONE_SCOPED_RULE_TYPES.includes(input.type) && input.geozoneId === null) {
    throw new Error("Geozone rules require a geozone")
  }
  if (input.type === "route_deviation" && input.routeId === null) {
    throw new Error("Route-deviation rules require a route")
  }
  if (
    input.type === "route_deviation" &&
    (input.deviationMeters === null || input.deviationMeters <= 0)
  ) {
    throw new Error("Route-deviation rules require a deviation distance")
  }
  let result: EventRule | null = null
  mutate((db) => {
    if (input.id !== undefined) {
      const existing = db.eventRules.find((r) => r.id === input.id)
      if (existing) {
        existing.name = input.name
        existing.type = input.type
        existing.geozoneId = input.geozoneId
        existing.routeId = input.routeId
        existing.speedLimitKmh = input.speedLimitKmh
        existing.thresholdMinutes = input.thresholdMinutes
        existing.deviationMeters = input.deviationMeters
        existing.vehicleIds = input.vehicleIds
        existing.severity = input.severity
        existing.notify = input.notify
        existing.active = input.active
        result = existing
        return
      }
    }
    const rule: EventRule = {
      id: input.id ?? nextId("rul"),
      name: input.name,
      type: input.type,
      geozoneId: input.geozoneId,
      routeId: input.routeId,
      speedLimitKmh: input.speedLimitKmh,
      thresholdMinutes: input.thresholdMinutes,
      deviationMeters: input.deviationMeters,
      vehicleIds: input.vehicleIds,
      severity: input.severity,
      notify: input.notify,
      active: input.active,
    }
    db.eventRules.push(rule)
    result = rule
  })
  return result!
}

export async function deleteEventRule(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    db.eventRules = db.eventRules.filter((r) => r.id !== id)
  })
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export async function listEvents(): Promise<FleetEvent[]> {
  await latency()
  // Newest first — the simulation keeps db.events newest-first already.
  return [...getDB().events]
}

export async function markAllEventsRead(): Promise<void> {
  await latency()
  mutate((db) => {
    for (const event of db.events) event.read = true
  })
}

function findEvent(db: ReturnType<typeof getDB>, id: ID): FleetEvent {
  const event = db.events.find((e) => e.id === id)
  if (!event) throw new Error(`Event ${id} not found`)
  return event
}

export async function acknowledgeEvent(
  id: ID,
  by: string
): Promise<FleetEvent> {
  await latency()
  let updated: FleetEvent | null = null
  mutate((db) => {
    const event = findEvent(db, id)
    if (event.status !== "open") {
      throw new Error("Only open events can be acknowledged")
    }
    event.status = "acknowledged"
    event.acknowledgedBy = by
    event.acknowledgedAt = nowIso()
    event.read = true
    updated = event
  })
  return updated!
}

export async function escalateEvent(
  id: ID,
  vars: { to: string; by: string }
): Promise<FleetEvent> {
  await latency()
  let updated: FleetEvent | null = null
  mutate((db) => {
    const event = findEvent(db, id)
    if (event.status !== "open" && event.status !== "acknowledged") {
      throw new Error("Only open or acknowledged events can be escalated")
    }
    if (event.status === "open") {
      event.acknowledgedBy = vars.by
      event.acknowledgedAt = nowIso()
    }
    event.status = "escalated"
    event.escalatedTo = vars.to
    event.escalatedAt = nowIso()
    event.read = true
    updated = event
  })
  return updated!
}

export async function closeEvent(
  id: ID,
  vars: { by: string; note: string }
): Promise<FleetEvent> {
  await latency()
  let updated: FleetEvent | null = null
  mutate((db) => {
    const event = findEvent(db, id)
    if (event.status === "closed") {
      throw new Error("Event is already closed")
    }
    event.status = "closed"
    event.closedBy = vars.by
    event.closedAt = nowIso()
    event.resolutionNote = vars.note
    event.read = true
    updated = event
  })
  return updated!
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function listRoutes(): Promise<RouteDef[]> {
  await latency()
  return [...getDB().routes]
}

export async function getRoute(id: ID): Promise<RouteDef | null> {
  await latency()
  return getDB().routes.find((r) => r.id === id) ?? null
}

function buildWaypoints(
  input: { name: string; position: LatLng }[]
): Waypoint[] {
  return input.map((w) => ({
    id: nextId("wpt"),
    name: w.name,
    position: w.position,
  }))
}

export async function createRoute(input: RouteInput): Promise<RouteDef> {
  await latency()
  let created: RouteDef | null = null
  mutate((db) => {
    const waypoints = buildWaypoints(input.waypoints)
    const path = densifyPath(waypoints.map((w) => w.position))
    const route: RouteDef = {
      id: nextId("rte"),
      name: input.name,
      description: input.description,
      path,
      waypoints,
      distanceKm: Math.round(pathLengthKm(path)),
      active: input.active,
      createdAt: nowIso(),
    }
    db.routes.push(route)
    created = route
  })
  return created!
}

export async function updateRoute(
  id: ID,
  patch: Partial<RouteInput>
): Promise<RouteDef> {
  await latency()
  let updated: RouteDef | null = null
  mutate((db) => {
    const route = db.routes.find((r) => r.id === id)
    if (!route) throw new Error(`Route ${id} not found`)

    if (patch.name !== undefined) route.name = patch.name
    if (patch.description !== undefined) route.description = patch.description
    if (patch.active !== undefined) route.active = patch.active
    if (patch.waypoints !== undefined) {
      route.waypoints = buildWaypoints(patch.waypoints)
      route.path = densifyPath(route.waypoints.map((w) => w.position))
      route.distanceKm = Math.round(pathLengthKm(route.path))
    }

    updated = route
  })
  return updated!
}

export async function deleteRoute(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    // Clear routeId on affected vehicles.
    for (const vehicle of db.vehicles) {
      if (vehicle.routeId === id) {
        vehicle.routeId = null
        vehicle.routeProgress = 0
        vehicle.routeDir = 1
      }
    }
    db.routes = db.routes.filter((r) => r.id !== id)
  })
}

export async function setRouteActive(id: ID, active: boolean): Promise<void> {
  await latency()
  mutate((db) => {
    const route = db.routes.find((r) => r.id === id)
    if (route) route.active = active
  })
}

export async function assignVehiclesToRoute(
  routeId: ID,
  vehicleIds: ID[]
): Promise<void> {
  await latency()
  const route = getDB().routes.find((r) => r.id === routeId)
  if (!route) throw new Error(`Route ${routeId} not found`)
  if (!route.active) {
    throw new Error(
      "Route is deactivated — it cannot be added to new vehicle itineraries"
    )
  }
  mutate((db) => {
    const ids = new Set(vehicleIds)
    for (const vehicle of db.vehicles) {
      if (ids.has(vehicle.id)) {
        const sameRoute = vehicle.routeId === routeId
        vehicle.routeId = routeId
        if (!sameRoute) {
          vehicle.routeProgress = 0
          vehicle.routeDir = 1
        }
      }
    }
  })
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

export async function listTripsForVehicle(vehicleId: ID): Promise<Trip[]> {
  await latency()
  return getDB()
    .trips.filter((t) => t.vehicleId === vehicleId)
    .sort((a, b) => (a.startAt < b.startAt ? 1 : -1))
}

// ---------------------------------------------------------------------------
// Accident / incident records
// ---------------------------------------------------------------------------

export interface AccidentInput {
  vehicleId: ID
  severity: IncidentSeverity
  rootCause: IncidentRootCause
  address: string
  /** ISO timestamp the accident occurred */
  occurredAt: string
  casualties: number
  repairCostEtb: number
  insuranceClaimEtb: number
  policeReportNo: string
  notes: string
}

/** Denormalize a vehicle into the fields stored on accidents. */
function denormalizeParties(
  db: ReturnType<typeof getDB>,
  vehicleId: ID
): {
  vehiclePlate: string
  entityId: ID
  location: LatLng
} {
  const vehicle = findVehicle(db, vehicleId)
  return {
    vehiclePlate: vehicle?.plate ?? "—",
    entityId: vehicle?.entityId ?? "",
    location: vehicle?.position ?? ADDIS,
  }
}

export async function listAccidents(): Promise<AccidentRecord[]> {
  await latency()
  return [...getDB().accidents]
}

export async function createAccident(
  input: AccidentInput
): Promise<AccidentRecord> {
  await latency()
  let created: AccidentRecord | null = null
  mutate((db) => {
    const parties = denormalizeParties(db, input.vehicleId)
    const record: AccidentRecord = {
      id: nextId("acc"),
      vehicleId: input.vehicleId,
      vehiclePlate: parties.vehiclePlate,
      entityId: parties.entityId,
      severity: input.severity,
      rootCause: input.rootCause,
      location: parties.location,
      address: input.address,
      occurredAt: input.occurredAt,
      casualties: input.casualties,
      policeReportNo: input.policeReportNo,
      repairCostEtb: input.repairCostEtb,
      insuranceClaimEtb: input.insuranceClaimEtb,
      notes: input.notes,
      createdAt: nowIso(),
    }
    db.accidents.push(record)
    created = record
  })
  return created!
}

export async function updateAccident(
  id: ID,
  patch: Partial<AccidentInput>
): Promise<AccidentRecord> {
  await latency()
  let updated: AccidentRecord | null = null
  mutate((db) => {
    const record = db.accidents.find((a) => a.id === id)
    if (!record) throw new Error(`Accident ${id} not found`)

    if (patch.vehicleId !== undefined) {
      const vehicleId = patch.vehicleId
      const parties = denormalizeParties(db, vehicleId)
      record.vehicleId = vehicleId
      record.vehiclePlate = parties.vehiclePlate
      record.entityId = parties.entityId
    }
    if (patch.severity !== undefined) record.severity = patch.severity
    if (patch.rootCause !== undefined) record.rootCause = patch.rootCause
    if (patch.address !== undefined) record.address = patch.address
    if (patch.occurredAt !== undefined) record.occurredAt = patch.occurredAt
    if (patch.casualties !== undefined) record.casualties = patch.casualties
    if (patch.repairCostEtb !== undefined)
      record.repairCostEtb = patch.repairCostEtb
    if (patch.insuranceClaimEtb !== undefined)
      record.insuranceClaimEtb = patch.insuranceClaimEtb
    if (patch.policeReportNo !== undefined)
      record.policeReportNo = patch.policeReportNo
    if (patch.notes !== undefined) record.notes = patch.notes

    updated = record
  })
  return updated!
}

export async function deleteAccident(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    db.accidents = db.accidents.filter((a) => a.id !== id)
  })
}

// ---------------------------------------------------------------------------
// Roles & web users (RBAC management — CRUD only)
// ---------------------------------------------------------------------------

export interface RoleInput {
  name: string
  type: RoleType
  description: string
  permissions: Permission[]
}

export interface WebUserInput {
  name: string
  email: string
  roleId: ID
  status: WebUserStatus
  phone: string
  entityId: ID | null
}

export async function listRoles(): Promise<Role[]> {
  await latency()
  return [...getDB().roles]
}

export async function createRole(input: RoleInput): Promise<Role> {
  await latency()
  let created: Role | null = null
  mutate((db) => {
    const role: Role = {
      id: nextId("role"),
      name: input.name,
      type: input.type,
      description: input.description,
      permissions: [...input.permissions],
      systemFixed: false,
      createdAt: nowIso(),
    }
    db.roles.push(role)
    created = role
  })
  return created!
}

export async function updateRole(
  id: ID,
  patch: Partial<RoleInput>
): Promise<Role> {
  await latency()
  let updated: Role | null = null
  mutate((db) => {
    const role = db.roles.find((r) => r.id === id)
    if (!role) throw new Error(`Role ${id} not found`)
    if (role.systemFixed) {
      throw new Error("The System Administrator role cannot be edited")
    }
    if (patch.name !== undefined) role.name = patch.name
    if (patch.type !== undefined) role.type = patch.type
    if (patch.description !== undefined) role.description = patch.description
    if (patch.permissions !== undefined)
      role.permissions = [...patch.permissions]
    updated = role
  })
  return updated!
}

export async function deleteRole(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    const role = db.roles.find((r) => r.id === id)
    if (!role) return
    if (role.systemFixed) {
      throw new Error("The System Administrator role cannot be deleted")
    }
    const assigned = db.webUsers.filter((u) => u.roleId === id).length
    if (assigned > 0) {
      throw new Error(
        `This role is assigned to ${assigned} user${assigned === 1 ? "" : "s"} — reassign them first`
      )
    }
    db.roles = db.roles.filter((r) => r.id !== id)
  })
}

export async function listWebUsers(): Promise<WebUser[]> {
  await latency()
  return [...getDB().webUsers]
}

export async function createWebUser(input: WebUserInput): Promise<WebUser> {
  await latency()
  let created: WebUser | null = null
  mutate((db) => {
    const user: WebUser = {
      id: nextId("usr"),
      name: input.name,
      email: input.email,
      roleId: input.roleId,
      status: input.status,
      phone: input.phone,
      entityId: input.entityId,
      lastLoginAt: null,
      createdAt: nowIso(),
    }
    db.webUsers.push(user)
    created = user
  })
  return created!
}

export async function updateWebUser(
  id: ID,
  patch: Partial<WebUserInput>
): Promise<WebUser> {
  await latency()
  let updated: WebUser | null = null
  mutate((db) => {
    const user = db.webUsers.find((u) => u.id === id)
    if (!user) throw new Error(`User ${id} not found`)
    if (patch.name !== undefined) user.name = patch.name
    if (patch.email !== undefined) user.email = patch.email
    if (patch.roleId !== undefined) user.roleId = patch.roleId
    if (patch.status !== undefined) user.status = patch.status
    if (patch.phone !== undefined) user.phone = patch.phone
    if (patch.entityId !== undefined) user.entityId = patch.entityId
    updated = user
  })
  return updated!
}

export async function deleteWebUser(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    db.webUsers = db.webUsers.filter((u) => u.id !== id)
  })
}
