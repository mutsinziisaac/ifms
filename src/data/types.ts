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

// Per-provider ITMS verification tally carried on the `/providers` list
// (`vehicle_stats`). `submitted` is the provider's total registered vehicles;
// the rest break that total down by verification state — authoritative counts
// straight from the backend.
export interface ProviderVehicleStats {
  submitted: number // total vehicles the provider has registered
  verified: number // matched in the ITMS registry
  notFound: number // no registry match ("Failed")
  unverified: number // not yet checked (in the verification queue)
}

// The provider record as returned by the live backend `GET /providers`. Lean by
// design — the endpoint carries only identity + lifecycle + a verification tally,
// no name/category/region/contact (those existed only on the in-memory `Entity`
// seed). The Providers feature reads this; the rest of the app still uses `Entity`.
export interface Provider {
  id: ID // numeric backend id, stringified (used for routing)
  code: string // provider_code — the displayed identifier + fleet-link key
  active: boolean
  createdAt: string // creation_time (ISO)
  modifiedAt: string // time_last_modified (ISO)
  vehicleStats: ProviderVehicleStats // vehicle_stats verification tally
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
  "saloon",
  "suv",
  "minibus",
  "van",
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

/**
 * ITMS catalogue verification state, mirroring the backend's
 * `itms_verification_status` (GET /api/v1/vehicles). VERIFIED = matched in the
 * ITMS registry; NOT_FOUND = no registry match ("Failed"); UNVERIFIED = not yet
 * checked. SCREAMING_CASE matches the wire format and the `?verification=` param.
 */
export const ITMS_VERIFICATION_STATUSES = [
  "VERIFIED",
  "NOT_FOUND",
  "UNVERIFIED",
] as const
export type ItmsVerificationStatus = (typeof ITMS_VERIFICATION_STATUSES)[number]

/**
 * Vehicle registry status from the catalogue (`status` on GET /api/v1/vehicles)
 * — the registration lifecycle, distinct from the operational `VehicleStatus`
 * (moving/idling/…) that comes from live telemetry.
 */
export const VEHICLE_REGISTRY_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "RETIRED",
  "BLOCKED",
] as const
export type VehicleRegistryStatus = (typeof VEHICLE_REGISTRY_STATUSES)[number]

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
  /** ITMS catalogue verification state (from GET /api/v1/vehicles). */
  itmsVerificationStatus: ItmsVerificationStatus
  /** Make, e.g. "Sinotruk" — only the backend catalogue supplies it. */
  make?: string
  /** Model, e.g. "Howo A7" — only the backend catalogue supplies it. */
  model?: string
  /** Telematics provider slug, e.g. "geotrack-et" (backend catalogue). */
  provider?: string
  /** Provider's external device/vehicle id (backend catalogue). */
  externalId?: string
  /** Registration lifecycle status (backend catalogue `status`). */
  registryStatus?: VehicleRegistryStatus
  // --- simulation bookkeeping (not rendered directly) ---
  /** 0..1 progress along the assigned route path */
  routeProgress: number
  routeDir: 1 | -1
}

// ---------------------------------------------------------------------------
// Provider vehicle positions
// ---------------------------------------------------------------------------

/**
 * A single vehicle's latest position report within a provider's transmission
 * batch. Mirrors the agreed positions wire payload (one entry of `positions[]`),
 * mapped to the app's vocabulary. There is no backend endpoint that lists a
 * provider's vehicles/positions yet, so the Provider detail page renders stable
 * dummy data of this shape — see src/data/provider-positions.ts.
 */
export interface VehiclePosition {
  /** Equals `messageId`; satisfies DataTable's row-id contract. */
  id: ID
  /** Ethiopian plate, e.g. "3-45821 ET" */
  plate: string
  /** ISO timestamp the device recorded this fix */
  recordedAt: string
  position: LatLng
  speedKmh: number
  /** Degrees clockwise from north */
  heading: number
  ignitionOn: boolean
  odometerKm: number
  messageId: string
  /** GPS fix accuracy in metres */
  accuracyMeters: number
  altitudeMeters: number
  /** Movement state mapped to the app's operational vocabulary */
  movementStatus: VehicleStatus
  /** 15-digit device IMEI */
  deviceImei: string
  /**
   * ITMS verification state. Not part of the position (telemetry) payload — the
   * batch layer assigns it so the provider's fleet matches its `vehicleStats`
   * tally (verified/unverified/notFound).
   */
  itmsVerificationStatus: ItmsVerificationStatus
}

/** A provider's transmission batch — `provider_code` + a list of positions. */
export interface ProviderPositions {
  providerCode: string
  sentAt: string
  sequence: number
  positions: VehiclePosition[]
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
  /** Per-zone draw color (hex). Backend `color_hex`; falls back to group/default. */
  color?: string
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
 * required); "route_deviation" is route-scoped (routeId required);
 * "global_speeding"/"idle"/"no_signal" apply fleet-wide (geozoneId/routeId
 * null).
 */
export const EVENT_RULE_TYPES = [
  "entry",
  "exit",
  "speeding",
  "route_deviation",
  "global_speeding",
  "idle",
  "no_signal",
  // Backend-only condition (GET /api/v1/alert-rules `condition_type: IGNITION`):
  // the app has no scope-based equivalent, so it gets its own generic bucket.
  "ignition",
] as const
export type EventRuleType = (typeof EVENT_RULE_TYPES)[number]

export const ZONE_RULE_TYPES = ["entry", "exit", "speeding"] as const
export type ZoneRuleType = (typeof ZONE_RULE_TYPES)[number]

export const ROUTE_RULE_TYPES = ["route_deviation"] as const
export type RouteRuleType = (typeof ROUTE_RULE_TYPES)[number]

/**
 * What a trigger does when it fires. In-app alerts are always emitted; email
 * and SMS are demo channels (recipients captured but not actually dispatched).
 */
export interface EventRuleNotify {
  email: boolean
  emailTo: string
  sms: boolean
  smsTo: string
}

export interface EventRule {
  id: ID
  /** Friendly policy name shown in the trigger list */
  name: string
  type: EventRuleType
  /** Required for entry/exit/speeding; null otherwise */
  geozoneId: ID | null
  /** Required for "route_deviation"; null otherwise */
  routeId: ID | null
  /** Only for "speeding" / "global_speeding" rules */
  speedLimitKmh: number | null
  /** Only for "idle" / "no_signal" rules — minutes before the rule fires */
  thresholdMinutes: number | null
  /** Only for "route_deviation" — metres off-corridor before the rule fires */
  deviationMeters: number | null
  /** Vehicles this trigger watches; null = every monitored vehicle */
  vehicleIds: ID[] | null
  /** Severity stamped on events this rule fires */
  severity: EventSeverity
  /** What happens when the trigger fires */
  notify: EventRuleNotify
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
  "route_deviation",
  "no_signal",
  "idle",
  // Backend-only alert condition (GET /api/v1/alerts `alert_type: IGNITION`): the
  // app has no scope-based equivalent, so it gets its own bucket — mirroring the
  // "ignition" member already on EventRuleType.
  "ignition",
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

// ---------------------------------------------------------------------------
// Backend alert vocabulary (GET /api/v1/alerts query params). The Alerts page
// filters server-side with these values, which the mappers translate to the
// app's EventStatus/EventType for display. Kept distinct from the app enums
// above because the backend has fewer statuses (no "escalated") and a
// condition-based type vocabulary.
// ---------------------------------------------------------------------------

export const ALERT_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED"] as const
export type AlertStatus = (typeof ALERT_STATUSES)[number]

export const ALERT_TYPES = [
  "SPEED",
  "GEOFENCE",
  "IGNITION",
  "TIME_AND_DISTANCE",
] as const
export type AlertType = (typeof ALERT_TYPES)[number]

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
  /** Set for route_deviation events so the feed can show route context */
  routeId: ID | null
  routeName: string | null
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
  /** Corridor endpoints. Set on backend-sourced routes; optional for the seed. */
  startAddress?: string
  endAddress?: string
  /** Itineraries bound to this route, per the backend list endpoint. */
  assignedItineraryCount?: number
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
// Access control (RBAC) — web users & roles. Permissions are a fixed catalog
// (SRS: predefined, not user-customizable): every module × action pair, stored
// as the string `${module}:${action}`. These power the Administration
// management screens; the current demo session keeps full access regardless.
// ---------------------------------------------------------------------------

export const PERMISSION_MODULES = [
  "fleet",
  "events",
  "geozones",
  "routes",
  "providers",
  "reports",
  "incidents",
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
  geozones: Geozone[]
  geozoneGroups: GeozoneGroup[]
  eventRules: EventRule[]
  events: FleetEvent[]
  providerTelemetry: ProviderTelemetry[]
  routes: RouteDef[]
  trips: Trip[]
  accidents: AccidentRecord[]
  roles: Role[]
  webUsers: WebUser[]
}
