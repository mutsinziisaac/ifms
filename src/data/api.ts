// Mock API layer. Every function is async with a little artificial latency so
// the UI exercises real loading states. All writes go through store.mutate so
// the version bumps and live consumers re-render. No backend exists.

import { densifyPath, nearestPlaceName } from "./geo"
import { getDB, mutate } from "./store"
import type {
  Driver,
  DriverStatus,
  Entity,
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
  LatLng,
  LicenseCategory,
  RouteDef,
  Trip,
  Vehicle,
  VehicleDriverAssignment,
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
  driverId: ID | null
  routeId: ID | null
}

export interface DriverInput {
  firstName: string
  lastName: string
  licenseNo: string
  licenseCategory: LicenseCategory
  licenseExpiry: string
  phone: string
  email: string
  entityId: ID
  status: DriverStatus
  assignedVehicleId: ID | null
  hireDate: string
  emergencyContactName: string
  emergencyContactPhone: string
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

function findDriver(db: ReturnType<typeof getDB>, id: ID): Driver | undefined {
  return db.drivers.find((d) => d.id === id)
}

/**
 * Keep the driver assignment history consistent when a vehicle's driver
 * changes: close the current open assignment and open a new one. No-op when
 * the driver is unchanged. Pass newDriverId null to just close the open one.
 */
function recordAssignmentChange(
  db: ReturnType<typeof getDB>,
  vehicleId: ID,
  newDriverId: ID | null
): void {
  const open = db.assignments.find(
    (a) => a.vehicleId === vehicleId && a.endAt === null
  )
  const currentDriverId = open?.driverId ?? null
  if (currentDriverId === newDriverId) return
  const now = nowIso()
  if (open) open.endAt = now
  if (newDriverId !== null) {
    db.assignments.push({
      id: nextId("asn"),
      vehicleId,
      driverId: newDriverId,
      startAt: now,
      endAt: null,
    })
  }
}

/**
 * Keep the bidirectional driver<->vehicle link consistent. Assigning a driver
 * to a vehicle clears that driver from any other vehicle and clears the
 * vehicle's previous driver. Pass driverId null to detach.
 */
function linkDriverToVehicle(
  db: ReturnType<typeof getDB>,
  vehicle: Vehicle,
  driverId: ID | null
): void {
  const previousDriverId = vehicle.driverId

  if (driverId !== null) {
    // Clear the incoming driver off any other vehicle.
    for (const other of db.vehicles) {
      if (other.id !== vehicle.id && other.driverId === driverId) {
        other.driverId = null
        recordAssignmentChange(db, other.id, null)
      }
    }
    const incoming = findDriver(db, driverId)
    if (incoming) incoming.assignedVehicleId = vehicle.id
  }

  // Clear the vehicle's previous driver's back-reference.
  if (previousDriverId !== null && previousDriverId !== driverId) {
    const prev = findDriver(db, previousDriverId)
    if (prev && prev.assignedVehicleId === vehicle.id) {
      prev.assignedVehicleId = null
    }
  }

  recordAssignmentChange(db, vehicle.id, driverId)
  vehicle.driverId = driverId
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
// Vehicles
// ---------------------------------------------------------------------------

export async function listVehicles(): Promise<Vehicle[]> {
  await latency()
  return [...getDB().vehicles]
}

export async function getVehicle(id: ID): Promise<Vehicle | null> {
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
      driverId: null,
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
      routeProgress: 0,
      routeDir: 1,
    }
    db.vehicles.push(vehicle)
    if (input.driverId !== null) {
      linkDriverToVehicle(db, vehicle, input.driverId)
    }
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

    if (patch.driverId !== undefined) {
      linkDriverToVehicle(db, vehicle, patch.driverId)
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
    // Clear the driver back-reference.
    if (vehicle.driverId !== null) {
      const driver = findDriver(db, vehicle.driverId)
      if (driver && driver.assignedVehicleId === id) {
        driver.assignedVehicleId = null
      }
    }
    // Drop its assignment history.
    db.assignments = db.assignments.filter((a) => a.vehicleId !== id)
    db.vehicles = db.vehicles.filter((v) => v.id !== id)
  })
}

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export async function listDrivers(): Promise<Driver[]> {
  await latency()
  return [...getDB().drivers]
}

export async function getDriver(id: ID): Promise<Driver | null> {
  await latency()
  return getDB().drivers.find((d) => d.id === id) ?? null
}

export async function createDriver(input: DriverInput): Promise<Driver> {
  await latency()
  let created: Driver | null = null
  mutate((db) => {
    const driver: Driver = {
      id: nextId("drv"),
      firstName: input.firstName,
      lastName: input.lastName,
      licenseNo: input.licenseNo,
      licenseCategory: input.licenseCategory,
      licenseExpiry: input.licenseExpiry,
      phone: input.phone,
      email: input.email,
      entityId: input.entityId,
      status: input.status,
      assignedVehicleId: null,
      hireDate: input.hireDate,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      safetyScore: Math.round(randomBetween(70, 99)),
      harshBrakingCount: Math.round(randomBetween(0, 12)),
      harshAccelCount: Math.round(randomBetween(0, 12)),
      speedingCount: Math.round(randomBetween(0, 8)),
    }
    db.drivers.push(driver)
    if (input.assignedVehicleId !== null) {
      const vehicle = findVehicle(db, input.assignedVehicleId)
      if (vehicle) linkDriverToVehicle(db, vehicle, driver.id)
    }
    created = driver
  })
  return created!
}

export async function updateDriver(
  id: ID,
  patch: Partial<DriverInput>
): Promise<Driver> {
  await latency()
  let updated: Driver | null = null
  mutate((db) => {
    const driver = findDriver(db, id)
    if (!driver) throw new Error(`Driver ${id} not found`)

    if (patch.firstName !== undefined) driver.firstName = patch.firstName
    if (patch.lastName !== undefined) driver.lastName = patch.lastName
    if (patch.licenseNo !== undefined) driver.licenseNo = patch.licenseNo
    if (patch.licenseCategory !== undefined)
      driver.licenseCategory = patch.licenseCategory
    if (patch.licenseExpiry !== undefined)
      driver.licenseExpiry = patch.licenseExpiry
    if (patch.phone !== undefined) driver.phone = patch.phone
    if (patch.email !== undefined) driver.email = patch.email
    if (patch.entityId !== undefined) driver.entityId = patch.entityId
    if (patch.status !== undefined) driver.status = patch.status
    if (patch.hireDate !== undefined) driver.hireDate = patch.hireDate
    if (patch.emergencyContactName !== undefined)
      driver.emergencyContactName = patch.emergencyContactName
    if (patch.emergencyContactPhone !== undefined)
      driver.emergencyContactPhone = patch.emergencyContactPhone

    if (patch.assignedVehicleId !== undefined) {
      applyDriverVehicleAssignment(db, driver, patch.assignedVehicleId)
    }

    updated = driver
  })
  return updated!
}

export async function deleteDriver(id: ID): Promise<void> {
  await latency()
  mutate((db) => {
    const driver = findDriver(db, id)
    if (!driver) return
    // Clear vehicle.driverId for any vehicle that referenced this driver and
    // close its open assignment. Past assignments are kept (the UI tolerates a
    // since-removed driver).
    for (const vehicle of db.vehicles) {
      if (vehicle.driverId === id) {
        vehicle.driverId = null
        recordAssignmentChange(db, vehicle.id, null)
      }
    }
    db.drivers = db.drivers.filter((d) => d.id !== id)
  })
}

/**
 * Assign (or detach) a vehicle to/from a driver, keeping the bidirectional
 * link consistent — same logic as create/update Vehicle.
 */
function applyDriverVehicleAssignment(
  db: ReturnType<typeof getDB>,
  driver: Driver,
  vehicleId: ID | null
): void {
  const previousVehicleId = driver.assignedVehicleId

  // Detach the driver from its previous vehicle if it changed.
  if (previousVehicleId !== null && previousVehicleId !== vehicleId) {
    const prevVehicle = findVehicle(db, previousVehicleId)
    if (prevVehicle && prevVehicle.driverId === driver.id) {
      prevVehicle.driverId = null
      recordAssignmentChange(db, prevVehicle.id, null)
    }
  }

  if (vehicleId !== null) {
    const vehicle = findVehicle(db, vehicleId)
    if (vehicle) {
      // Clear whoever else was holding this vehicle.
      if (vehicle.driverId !== null && vehicle.driverId !== driver.id) {
        const otherDriver = findDriver(db, vehicle.driverId)
        if (otherDriver) otherDriver.assignedVehicleId = null
      }
      // Clear this driver off any other vehicle.
      for (const other of db.vehicles) {
        if (other.id !== vehicle.id && other.driverId === driver.id) {
          other.driverId = null
          recordAssignmentChange(db, other.id, null)
        }
      }
      recordAssignmentChange(db, vehicle.id, driver.id)
      vehicle.driverId = driver.id
    }
  }

  driver.assignedVehicleId = vehicleId
}

export async function assignVehicleToDriver(
  driverId: ID,
  vehicleId: ID | null
): Promise<void> {
  await latency()
  mutate((db) => {
    const driver = findDriver(db, driverId)
    if (!driver) throw new Error(`Driver ${driverId} not found`)
    applyDriverVehicleAssignment(db, driver, vehicleId)
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
// Driver assignment history
// ---------------------------------------------------------------------------

export async function listAssignmentsForVehicle(
  vehicleId: ID
): Promise<VehicleDriverAssignment[]> {
  await latency()
  return getDB()
    .assignments.filter((a) => a.vehicleId === vehicleId)
    .sort((a, b) => (a.startAt < b.startAt ? 1 : -1))
}

// ---------------------------------------------------------------------------
// Accident / incident records
// ---------------------------------------------------------------------------

export interface AccidentInput {
  vehicleId: ID
  driverId: ID | null
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

/** Denormalize a vehicle + driver into the fields stored on accidents. */
function denormalizeParties(
  db: ReturnType<typeof getDB>,
  vehicleId: ID,
  driverId: ID | null
): {
  vehiclePlate: string
  entityId: ID
  location: LatLng
  driverName: string | null
} {
  const vehicle = findVehicle(db, vehicleId)
  const driver = driverId ? findDriver(db, driverId) : undefined
  return {
    vehiclePlate: vehicle?.plate ?? "—",
    entityId: vehicle?.entityId ?? "",
    location: vehicle?.position ?? ADDIS,
    driverName: driver ? `${driver.firstName} ${driver.lastName}` : null,
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
    const parties = denormalizeParties(db, input.vehicleId, input.driverId)
    const record: AccidentRecord = {
      id: nextId("acc"),
      vehicleId: input.vehicleId,
      vehiclePlate: parties.vehiclePlate,
      driverId: input.driverId,
      driverName: parties.driverName,
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

    if (patch.vehicleId !== undefined || patch.driverId !== undefined) {
      const vehicleId = patch.vehicleId ?? record.vehicleId
      const driverId =
        patch.driverId !== undefined ? patch.driverId : record.driverId
      const parties = denormalizeParties(db, vehicleId, driverId)
      record.vehicleId = vehicleId
      record.driverId = driverId
      record.vehiclePlate = parties.vehiclePlate
      record.entityId = parties.entityId
      record.driverName = parties.driverName
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
