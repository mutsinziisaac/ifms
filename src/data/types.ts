// Domain model for the IFMS prototype (Ministry of Transport & Logistics
// Ethiopia). All data is dummy and lives in an in-memory store — see
// src/data/store.ts. These types are the contract the whole app codes against.

export type ID = string

export interface LatLng {
  lat: number
  lng: number
}

// ---------------------------------------------------------------------------
// Entities — the monitored transport/logistics companies ("other entities")
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

export interface Entity {
  id: ID
  name: string
  shortName: string
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
// Geozones & alert rules
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

export const ALERT_RULE_TYPES = ["entry", "exit", "speeding"] as const
export type AlertRuleType = (typeof ALERT_RULE_TYPES)[number]

export interface AlertRule {
  id: ID
  geozoneId: ID
  type: AlertRuleType
  /** Only for "speeding" rules */
  speedLimitKmh: number | null
  /** Deactivated rules never generate alerts */
  active: boolean
}

// ---------------------------------------------------------------------------
// Alerts (the live events feed)
// ---------------------------------------------------------------------------

export const ALERT_TYPES = [
  "entry",
  "exit",
  "speeding",
  "no_signal",
  "idle",
] as const
export type AlertType = (typeof ALERT_TYPES)[number]

export type AlertSeverity = "info" | "warning" | "critical"

export interface Alert {
  id: ID
  type: AlertType
  severity: AlertSeverity
  vehicleId: ID
  vehiclePlate: string
  geozoneId: ID | null
  geozoneName: string | null
  message: string
  /** ISO timestamp */
  at: string
  location: LatLng
  read: boolean
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
  alertRules: AlertRule[]
  alerts: Alert[]
  routes: RouteDef[]
  trips: Trip[]
  assignments: VehicleDriverAssignment[]
  maintenanceTasks: MaintenanceTask[]
}
