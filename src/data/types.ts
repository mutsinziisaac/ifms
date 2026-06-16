// Domain model for the IFMS prototype (Ministry of Transport & Logistics
// Ethiopia). All data is dummy and lives in an in-memory store — see
// src/data/store.ts. These types are the contract the whole app codes against.

export type ID = string

export interface LatLng {
  lat: number
  lng: number
}

// ---------------------------------------------------------------------------
// Entities — the monitored government institutions ("providers") whose fleets
// transmit device data to the MoTL platform
// ---------------------------------------------------------------------------

export const ETHIOPIA_REGIONS = [
  "Addis Ababa",
  "Oromia",
  "Amhara",
  "Dire Dawa",
  "Somali",
  "Afar",
  "Tigray",
  "Sidama",
] as const
export type EthiopiaRegion = (typeof ETHIOPIA_REGIONS)[number]

export const ENTITY_CATEGORIES = ["ministry", "agency", "enterprise"] as const
export type EntityCategory = (typeof ENTITY_CATEGORIES)[number]

export interface Entity {
  id: ID
  name: string
  shortName: string
  category: EntityCategory
  address: string
  phone: string
  email: string
  region: EthiopiaRegion
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

export const VEHICLE_STATUSES = [
  "moving",
  "idling",
  "ignition_off",
  "no_signal",
  "ignition_blocked",
] as const
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]

export const VEHICLE_TYPES = [
  "truck",
  "trailer",
  "tanker",
  "bus",
  "container",
  "pickup",
] as const
export type VehicleType = (typeof VEHICLE_TYPES)[number]

export const GPS_PROVIDERS = [
  "NileTrack GPS",
  "GulfSky Telematics",
  "SafeFleet Ethiopia",
  "OrbitGeo Systems",
  "Horizon Tracking",
] as const
export type GpsProvider = (typeof GPS_PROVIDERS)[number]

export interface Vehicle {
  id: ID
  /** Ethiopian plate, e.g. "3-45821 ET" */
  plate: string
  type: VehicleType
  /** Make/model description, e.g. "Sinotruk Howo A7 dry cargo" */
  description: string
  entityId: ID
  region: EthiopiaRegion
  gpsProvider: GpsProvider
  driverId: ID | null
  status: VehicleStatus
  /** ISO timestamp the current status began (drives "status duration") */
  statusSince: string
  position: LatLng
  /** Degrees clockwise from north */
  heading: number
  speedKmh: number
  odometerKm: number
  fuelPct: number
  /** ISO timestamp of last GPS signal sync */
  lastSyncAt: string
  /** Assigned route (vehicle itinerary), if any */
  routeId: ID | null
  /** Geozone the vehicle is currently inside (computed by the simulation) */
  insideGeozoneId: ID | null
  createdAt: string
  // --- simulation bookkeeping (not rendered directly) ---
  /** 0..1 progress along the assigned route path */
  routeProgress: number
  routeDir: 1 | -1
}

// ---------------------------------------------------------------------------
// Drivers
// ---------------------------------------------------------------------------

export const LICENSE_CATEGORIES = [
  "B",
  "C1",
  "C",
  "D",
  "E",
  "Public I",
  "Public II",
] as const
export type LicenseCategory = (typeof LICENSE_CATEGORIES)[number]

export const DRIVER_STATUSES = [
  "active",
  "on_leave",
  "suspended",
  "inactive",
] as const
export type DriverStatus = (typeof DRIVER_STATUSES)[number]

export interface Driver {
  id: ID
  firstName: string
  lastName: string
  licenseNo: string
  licenseCategory: LicenseCategory
  /** ISO date */
  licenseExpiry: string
  phone: string
  email: string
  entityId: ID
  status: DriverStatus
  assignedVehicleId: ID | null
  /** ISO date */
  hireDate: string
  emergencyContactName: string
  emergencyContactPhone: string
  /** 0..100 — drives the safety panel on the driver detail page */
  safetyScore: number
  harshBrakingCount: number
  harshAccelCount: number
  speedingCount: number
}

// ---------------------------------------------------------------------------
// Geozones & event rules
// ---------------------------------------------------------------------------

export type GeozoneShape = "polygon" | "circle"

export interface Geozone {
  id: ID
  name: string
  shape: GeozoneShape
  /** Circle center, or label anchor / centroid for polygons */
  center: LatLng
  /** Circle radius in meters (null for polygons) */
  radiusM: number | null
  /** Polygon vertices (null for circles) */
  path: LatLng[] | null
  address: string
  groupId: ID | null
  /** Show/hide on the map */
  visible: boolean
  /** Corridor point of interest */
  isPOI: boolean
  note: string
  createdAt: string
}

export interface GeozoneGroup {
  id: ID
  name: string
  /** Hex color used to draw member geozones */
  color: string
}

/**
 * Rule types: "entry"/"exit"/"speeding" are geozone-scoped (geozoneId
 * required); "global_speeding"/"idle"/"no_signal" apply fleet-wide
 * (geozoneId null).
 */
export const EVENT_RULE_TYPES = [
  "entry",
  "exit",
  "speeding",
  "global_speeding",
  "idle",
  "no_signal",
] as const
export type EventRuleType = (typeof EVENT_RULE_TYPES)[number]

export const ZONE_RULE_TYPES = ["entry", "exit", "speeding"] as const
export type ZoneRuleType = (typeof ZONE_RULE_TYPES)[number]

export interface EventRule {
  id: ID
  type: EventRuleType
  /** Required for entry/exit/speeding; null for global rule types */
  geozoneId: ID | null
  /** Only for "speeding" / "global_speeding" rules */
  speedLimitKmh: number | null
  /** Only for "idle" / "no_signal" rules — minutes before the rule fires */
  thresholdMinutes: number | null
  /** Severity stamped on events this rule fires */
  severity: EventSeverity
  /** Deactivated rules never generate events */
  active: boolean
}

// ---------------------------------------------------------------------------
// Events (the live violations feed, with a handling workflow)
// ---------------------------------------------------------------------------

export const EVENT_TYPES = [
  "entry",
  "exit",
  "speeding",
  "no_signal",
  "idle",
] as const
export type EventType = (typeof EVENT_TYPES)[number]

export type EventSeverity = "info" | "warning" | "critical"

export const EVENT_STATUSES = [
  "open",
  "acknowledged",
  "escalated",
  "closed",
] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

/** Where an event can be escalated to (demo-grade constant list). */
export const ESCALATION_TARGETS = [
  "Corridor Operations Director",
  "Federal Transport Authority",
  "Regional Police Liaison",
] as const

/** Named FleetEvent (not Event) to avoid colliding with the DOM global. */
export interface FleetEvent {
  id: ID
  type: EventType
  severity: EventSeverity
  vehicleId: ID
  vehiclePlate: string
  /** Provider (entity) the vehicle belongs to, denormalized for filtering */
  entityId: ID
  geozoneId: ID | null
  geozoneName: string | null
  message: string
  /** ISO timestamp */
  at: string
  location: LatLng
  /** Notification read-state — independent of the handling workflow */
  read: boolean
  // --- handling workflow ---
  status: EventStatus
  acknowledgedBy: string | null
  acknowledgedAt: string | null
  escalatedTo: string | null
  escalatedAt: string | null
  closedBy: string | null
  closedAt: string | null
  resolutionNote: string | null
}

// ---------------------------------------------------------------------------
// Provider telemetry (per-entity transmission stats, updated by the sim)
// ---------------------------------------------------------------------------

export interface ProviderTelemetry {
  entityId: ID
  /** Total position messages received since the session started */
  messagesTotal: number
  /** Per-tick transmission counts, oldest → newest, capped at 40 samples */
  history: number[]
}

// ---------------------------------------------------------------------------
// Routes & trips
// ---------------------------------------------------------------------------

export interface Waypoint {
  id: ID
  name: string
  position: LatLng
}

export interface RouteDef {
  id: ID
  name: string
  description: string
  /** Densified polyline used for map rendering and the simulation */
  path: LatLng[]
  waypoints: Waypoint[]
  distanceKm: number
  /**
   * Deactivated routes remain effective for vehicles already assigned, but
   * cannot be added to new vehicle itineraries (SRS Route Management).
   */
  active: boolean
  createdAt: string
}

export interface Trip {
  id: ID
  vehicleId: ID
  routeId: ID | null
  startAt: string
  endAt: string
  startAddress: string
  endAddress: string
  distanceKm: number
  avgSpeedKmh: number
  maxSpeedKmh: number
  /** Polyline for history playback */
  path: LatLng[]
}

// ---------------------------------------------------------------------------
// Driver assignment history
// ---------------------------------------------------------------------------

/**
 * Who drove a vehicle, and when. The open assignment (endAt === null) for a
 * vehicle always matches its current `driverId`. Travel history is attributed
 * by finding the assignment whose window covers a trip's start time.
 */
export interface VehicleDriverAssignment {
  id: ID
  vehicleId: ID
  driverId: ID
  /** ISO timestamp the assignment began */
  startAt: string
  /** ISO timestamp it ended, or null for the current/open assignment */
  endAt: string | null
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export type MaintenanceParamType = "mileage" | "date"
export type MaintenanceConfirmation = "manual" | "automatic"

export const MAINTENANCE_STATUSES = ["ok", "waiting", "delay"] as const
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number]

export interface MaintenanceVehicleState {
  vehicleId: ID
  /** Reference point for mileage tasks */
  lastServiceKm: number | null
  /** Reference point for date tasks (ISO date) */
  lastServiceDate: string | null
}

export interface MaintenanceTask {
  id: ID
  title: string
  description: string
  paramType: MaintenanceParamType
  /** Interval in km (mileage tasks) */
  intervalKm: number | null
  /** Interval in days (date tasks) */
  intervalDays: number | null
  /** Repeat the task after each completion */
  repeat: boolean
  confirmation: MaintenanceConfirmation
  emailNotifications: boolean
  /** Alert window before due — km or days depending on paramType */
  alertBefore: number
  vehicles: MaintenanceVehicleState[]
  createdAt: string
}

/**
 * A completed service (work order). Stored as a flat top-level log (like
 * `events`/`trips`) keyed by task + vehicle, so cost KPIs are a one-pass reduce
 * and history survives a task's vehicle-membership being edited.
 */
export interface MaintenanceServiceRecord {
  id: ID
  taskId: ID
  vehicleId: ID
  /** ISO timestamp the service was performed */
  servicedAt: string
  /** Odometer at service time (mileage tasks); null for date-only tasks */
  odometerKm: number | null
  /** Cost in Ethiopian Birr (ETB), whole birr */
  cost: number
  workshop: string
  technician: string | null
  notes: string
}

// ---------------------------------------------------------------------------
// Safety & incidents (accident records — SRS Safety & Incident Dashboard)
// ---------------------------------------------------------------------------

export const INCIDENT_SEVERITIES = ["minor", "medium", "major"] as const
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number]

export const INCIDENT_ROOT_CAUSES = [
  "driver_error",
  "weather",
  "mechanical",
  "other",
] as const
export type IncidentRootCause = (typeof INCIDENT_ROOT_CAUSES)[number]

export interface AccidentRecord {
  id: ID
  vehicleId: ID
  /** Denormalized plate so the record survives a since-deleted vehicle */
  vehiclePlate: string
  driverId: ID | null
  driverName: string | null
  entityId: ID
  severity: IncidentSeverity
  rootCause: IncidentRootCause
  location: LatLng
  address: string
  /** ISO timestamp the accident occurred */
  occurredAt: string
  casualties: number
  policeReportNo: string
  /** Repair cost in Ethiopian Birr (ETB) */
  repairCostEtb: number
  /** Insurance claim in ETB */
  insuranceClaimEtb: number
  notes: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Compliance & fines (SRS Compliance & Fines Dashboard)
// ---------------------------------------------------------------------------

export const VIOLATION_TYPES = ["speeding", "parking", "overloading"] as const
export type ViolationType = (typeof VIOLATION_TYPES)[number]

export const FINE_STATUSES = ["paid", "pending", "disputed"] as const
export type FineStatus = (typeof FINE_STATUSES)[number]

export interface Fine {
  id: ID
  vehicleId: ID
  vehiclePlate: string
  driverId: ID | null
  driverName: string | null
  entityId: ID
  violationType: ViolationType
  /** Fine amount in Ethiopian Birr (ETB) */
  amountEtb: number
  /** ISO timestamp the fine was issued */
  issuedAt: string
  location: LatLng
  address: string
  status: FineStatus
  /** Optional link to the speeding FleetEvent that generated this fine */
  eventId: ID | null
  ticketNo: string
  notes: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Access control (RBAC) — web users & roles. Permissions are a fixed catalog
// (SRS: predefined, not user-customizable): every module × action pair, stored
// as the string `${module}:${action}`. These power the Administration
// management screens; the current demo session keeps full access regardless.
// ---------------------------------------------------------------------------

export const PERMISSION_MODULES = [
  "fleet",
  "drivers",
  "events",
  "geozones",
  "routes",
  "maintenance",
  "providers",
  "reports",
  "incidents",
  "fines",
  "admin",
] as const
export type PermissionModule = (typeof PERMISSION_MODULES)[number]

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "manage",
] as const
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number]

/** A single permission token, e.g. "fleet:view". */
export type Permission = `${PermissionModule}:${PermissionAction}`

export const ROLE_TYPES = ["admin", "fms"] as const
export type RoleType = (typeof ROLE_TYPES)[number]

export interface Role {
  id: ID
  name: string
  type: RoleType
  description: string
  permissions: Permission[]
  /** The single fixed System Admin role — read-only, cannot be edited/deleted */
  systemFixed: boolean
  createdAt: string
}

export const WEB_USER_STATUSES = ["active", "inactive", "locked"] as const
export type WebUserStatus = (typeof WEB_USER_STATUSES)[number]

export interface WebUser {
  id: ID
  name: string
  email: string
  roleId: ID
  status: WebUserStatus
  phone: string
  /** Institution the user belongs to (null for ministry-wide accounts) */
  entityId: ID | null
  /** ISO timestamp of the last sign-in, or null if never signed in */
  lastLoginAt: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Session (mock auth)
// ---------------------------------------------------------------------------

export interface SessionUser {
  name: string
  email: string
  role: string
}

// ---------------------------------------------------------------------------
// The whole in-memory database
// ---------------------------------------------------------------------------

export interface DB {
  entities: Entity[]
  vehicles: Vehicle[]
  drivers: Driver[]
  geozones: Geozone[]
  geozoneGroups: GeozoneGroup[]
  eventRules: EventRule[]
  events: FleetEvent[]
  providerTelemetry: ProviderTelemetry[]
  routes: RouteDef[]
  trips: Trip[]
  assignments: VehicleDriverAssignment[]
  maintenanceTasks: MaintenanceTask[]
  maintenanceServiceRecords: MaintenanceServiceRecord[]
  accidents: AccidentRecord[]
  fines: Fine[]
  roles: Role[]
  webUsers: WebUser[]
}
