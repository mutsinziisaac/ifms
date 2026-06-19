// Adapters from backend wire DTOs (snake_case, per the OpenAPI spec) to the
// app's domain model. Kept separate from api.ts so the transforms stay pure and
// the call layer stays focused on orchestration.

import {
  centroidOf,
  geoJsonToPolygonPath,
  lineStringToPath,
  pathLengthKm,
} from "@/lib/maps"

import type {
  EventRule,
  EventRuleType,
  EventSeverity,
  EventStatus,
  EventType,
  FleetEvent,
  Geozone,
  GeozoneShape,
  ItmsVerificationStatus,
  LatLng,
  Provider,
  RouteDef,
  Vehicle,
  VehiclePosition,
  VehicleStatus,
  VehicleType,
  Waypoint,
} from "./types"

/**
 * `VehicleResponse` from `GET /api/v1/vehicles`
 * (`PayloadArrayVehicleResponse.data[]`). This is the *catalogue* record — it
 * carries identity + registry fields + ITMS verification, but NO live telemetry
 * (position/speed/operational status come from /vehicles/map & /location, which
 * are out of scope here).
 */
export interface VehicleResponse {
  id: number
  stakeholder_id: number | null
  provider: string | null
  external_id: string | null
  plate_number: string | null
  truck_number: string | null
  vin_or_chassis: string | null
  owner_id: number | null
  type:
    | "CONTAINER"
    | "TRAILER"
    | "TRUCK"
    | "BUS"
    | "TRAIN"
    | "BOAT"
    | "SHIP"
    | "AIRPLANE"
  // Registry status (active/suspended/…), NOT the operational moving/idling state.
  status: "ACTIVE" | "SUSPENDED" | "RETIRED" | "BLOCKED"
  make: string | null
  model: string | null
  colour: string | null
  fuel_type: string | null
  exemption_status: string | null
  exemption_reason_code: string | null
  description: string | null
  client_association: string | null
  itms_verification_status: ItmsVerificationStatus
  creation_time: string | null
  time_last_modified: string | null
}

// Backend vehicle types → the frontend VehicleType union. Types with no frontend
// equivalent (train/boat/ship/airplane) fall back to "truck".
const TYPE_MAP: Record<VehicleResponse["type"], VehicleType> = {
  CONTAINER: "container",
  TRAILER: "trailer",
  TRUCK: "truck",
  BUS: "bus",
  TRAIN: "truck",
  BOAT: "truck",
  SHIP: "truck",
  AIRPLANE: "truck",
}

const ADDIS = { lat: 9.0301, lng: 38.7468 }

/**
 * Map a catalogue `VehicleResponse` onto the app's `Vehicle`. The catalogue has
 * no live telemetry, so operational fields (status/position/speed/odometer/
 * fuel) and the entity/region/gps facets get stable placeholders — verification
 * is the only axis the list endpoint actually drives. This is a deliberate
 * consequence of the catalogue-vs-telemetry split, not a bug.
 */
export function mapVehicleResponse(dto: VehicleResponse): Vehicle {
  const created = dto.creation_time ?? new Date().toISOString()
  const synced = dto.time_last_modified ?? created
  const description =
    dto.description?.trim() ||
    [dto.make, dto.model].filter(Boolean).join(" ").trim() ||
    "—"
  return {
    id: String(dto.id),
    plate:
      dto.plate_number ?? dto.truck_number ?? dto.external_id ?? `#${dto.id}`,
    type: TYPE_MAP[dto.type] ?? "truck",
    description,
    make: dto.make ?? undefined,
    model: dto.model ?? undefined,
    // Real catalogue fields, surfaced on the Fleet verification view.
    provider: dto.provider ?? undefined,
    externalId: dto.external_id ?? undefined,
    registryStatus: dto.status,
    // entity/region/gps are catalogue-absent — stable placeholders so the
    // existing columns/filters keep rendering.
    entityId: dto.provider ?? "",
    region: "Addis Ababa",
    gpsProvider: "NileTrack GPS",
    // operational defaults — no telemetry on the catalogue endpoint.
    status: "no_signal",
    statusSince: created,
    position: ADDIS,
    heading: 0,
    speedKmh: 0,
    odometerKm: 0,
    fuelPct: 0,
    lastSyncAt: synced,
    routeId: null,
    insideGeozoneId: null,
    createdAt: created,
    routeProgress: 0,
    routeDir: 1,
    itmsVerificationStatus: dto.itms_verification_status,
  }
}

/**
 * A single item from `GET /api/v1/vehicles/map` — the live snapshot that drives
 * the map. Carries last-known position + a movement state + verification, but
 * no heading/speed/telemetry detail (those live on /vehicles/{id}/location).
 */
export interface VehicleMapItem {
  vehicle_id: number
  movement_state: string
  last_latitude: number
  last_longitude: number
  state_since: string | null
  last_seen_at: string | null
  plate_number?: string | null
  // Operating provider/entity display name, surfaced on the map marker.
  provider_name?: string | null
  itms_verification_status: ItmsVerificationStatus
}

// Backend movement states → the app's operational VehicleStatus. Unknown → no_signal.
const MOVEMENT_STATE_MAP: Record<string, VehicleStatus> = {
  MOVING: "moving",
  IDLING: "idling",
  IGNITION_OFF: "ignition_off",
  NO_SIGNAL: "no_signal",
  IGNITION_BLOCKED: "ignition_blocked",
}

/**
 * Map a `/vehicles/map` snapshot item onto `Vehicle`. The snapshot has no
 * heading/speed/route/fuel, so those get neutral defaults; position, status,
 * plate and verification come straight from the backend. `id` is `vehicle_id`
 * stringified so it matches the Fleet-list ids (and the detail route).
 */
export function mapVehicleMapItem(dto: VehicleMapItem): Vehicle {
  const synced = dto.last_seen_at ?? new Date().toISOString()
  return {
    id: String(dto.vehicle_id),
    plate: dto.plate_number ?? `#${dto.vehicle_id}`,
    type: "truck",
    description: "—",
    // The snapshot carries no entity id; the provider display name (when sent)
    // surfaces on the map marker via `provider` (see FleetLiveMap).
    provider: dto.provider_name ?? undefined,
    entityId: "",
    region: "Addis Ababa",
    gpsProvider: "NileTrack GPS",
    status: MOVEMENT_STATE_MAP[dto.movement_state] ?? "no_signal",
    statusSince: dto.state_since ?? synced,
    position: { lat: dto.last_latitude, lng: dto.last_longitude },
    heading: 0,
    speedKmh: 0,
    odometerKm: 0,
    fuelPct: 0,
    lastSyncAt: synced,
    routeId: null,
    insideGeozoneId: null,
    createdAt: synced,
    routeProgress: 0,
    routeDir: 1,
    itmsVerificationStatus: dto.itms_verification_status,
  }
}

/**
 * A provider record from `GET /api/v1/providers` (`PayloadArrayProviderResponse
 * .data[]`). Identity + lifecycle, plus a `vehicle_stats` verification tally —
 * no name/category/region/contact.
 */
export interface ProviderResponse {
  id: number
  provider_code: string | null
  active: boolean
  creation_time: string | null
  time_last_modified: string | null
  vehicle_stats?: {
    submitted: number | null
    verified: number | null
    not_found: number | null
    unverified: number | null
  } | null
}

/** Map a `ProviderResponse` onto the app's lean `Provider`. */
export function mapProviderResponse(dto: ProviderResponse): Provider {
  const created = dto.creation_time ?? new Date().toISOString()
  const s = dto.vehicle_stats
  return {
    id: String(dto.id),
    code: dto.provider_code ?? `#${dto.id}`,
    active: dto.active,
    createdAt: created,
    modifiedAt: dto.time_last_modified ?? created,
    vehicleStats: {
      submitted: s?.submitted ?? 0,
      verified: s?.verified ?? 0,
      notFound: s?.not_found ?? 0,
      unverified: s?.unverified ?? 0,
    },
  }
}

/**
 * A single vehicle position from a provider's transmission batch — one entry of
 * `data.positions[]` in the agreed positions payload. snake_case per the wire
 * contract; there is no live endpoint for this yet, so the only producer today
 * is the dummy generator (src/data/provider-positions.ts).
 */
export interface ProviderPositionItem {
  vehicle_plate_number: string
  recorded_at: string
  latitude: number
  longitude: number
  speed_kmh: number
  heading_degrees: number
  ignition_on: boolean
  odometer_km: number
  message_id: string
  accuracy_meters: number
  altitude_meters: number
  movement_status: string
  device_imei: string
  extras: Record<string, string>
}

/** The positions batch envelope — `data` of the positions payload. */
export interface ProviderPositionsResponse {
  provider_code: string
  sent_at: string
  sequence: number
  positions: ProviderPositionItem[]
}

// Backend movement_status strings → the app's operational VehicleStatus. Unknown
// → no_signal (mirrors MOVEMENT_STATE_MAP for the /vehicles/map snapshot).
const POSITION_MOVEMENT_MAP: Record<string, VehicleStatus> = {
  MOVING: "moving",
  IDLING: "idling",
  STOPPED: "ignition_off",
  PARKED: "ignition_off",
  OFFLINE: "no_signal",
  NO_SIGNAL: "no_signal",
}

/**
 * Map a wire `ProviderPositionItem` onto the app's `VehiclePosition`. The
 * telemetry payload carries no verification state, so the caller supplies it (the
 * batch distributes statuses to match the provider's `vehicleStats`).
 */
export function mapVehiclePosition(
  dto: ProviderPositionItem,
  verification: ItmsVerificationStatus
): VehiclePosition {
  return {
    id: dto.message_id,
    plate: dto.vehicle_plate_number,
    recordedAt: dto.recorded_at,
    position: { lat: dto.latitude, lng: dto.longitude },
    speedKmh: dto.speed_kmh,
    heading: dto.heading_degrees,
    ignitionOn: dto.ignition_on,
    odometerKm: dto.odometer_km,
    messageId: dto.message_id,
    accuracyMeters: dto.accuracy_meters,
    altitudeMeters: dto.altitude_meters,
    movementStatus: POSITION_MOVEMENT_MAP[dto.movement_status] ?? "no_signal",
    deviceImei: dto.device_imei,
    itmsVerificationStatus: verification,
  }
}

/**
 * An alert-rule record from `GET /api/v1/alert-rules` (`data[]`). The backend
 * models rules by *condition* — a `condition_type` plus a JSON payload — rather
 * than by the app's scope-based `EventRuleType`, and carries fields the app's
 * model has no slot for (combinator, trigger_timing, active_window). The list
 * page only needs name/type/threshold/severity/active, so the rest is ignored.
 */
export interface AlertRuleResponse {
  id: number
  name: string
  condition_type: string
  combinator: string | null
  trigger_timing: string | null
  active_window: string | null
  severity: string
  active: boolean
  // A JSON-encoded, condition-type-specific object, e.g. {"limit_kmh":80} or
  // {"direction":"OUTSIDE"} or {"minutes":30,...}. May be null/absent.
  condition_payload_json: string | null
  creation_time: string | null
  time_last_modified: string | null
}

// Backend severity (4 levels) → the app's 3-level EventSeverity. The app has no
// distinct "low" tier, so LOW collapses into "info"; HIGH is the only "critical".
const SEVERITY_MAP: Record<string, EventSeverity> = {
  INFO: "info",
  LOW: "info",
  MEDIUM: "warning",
  HIGH: "critical",
}

/** Parse `condition_payload_json` defensively — it's a JSON string or null. */
function parsePayload(raw: string | null): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/**
 * Map a backend `condition_type` (+ its payload) onto the app's `EventRuleType`.
 * This endpoint carries no geozone/route binding, so geofence rules resolve to
 * entry/exit purely by their `direction`. Condition types with no scope-based
 * equivalent (IGNITION, plus any the backend adds later) fall back to the
 * generic "ignition" bucket so the row still renders honestly under its name.
 */
function ruleTypeFor(
  conditionType: string,
  payload: Record<string, unknown>
): EventRuleType {
  switch (conditionType) {
    case "SPEED":
      return "global_speeding"
    case "GEOFENCE":
      return payload.direction === "OUTSIDE" ? "exit" : "entry"
    case "TIME_AND_DISTANCE":
      return "idle"
    case "IGNITION":
      return "ignition"
    default:
      return "ignition"
  }
}

/**
 * Map an `AlertRuleResponse` onto the app's `EventRule`. Scope (geozone/route),
 * per-vehicle targeting and notification channels aren't part of this endpoint,
 * so they get neutral defaults (fleet-wide, all vehicles, no channels) — the
 * list surfaces name, type, threshold, severity and the active toggle, which is
 * exactly what the backend drives.
 */
export function mapAlertRuleResponse(dto: AlertRuleResponse): EventRule {
  const payload = parsePayload(dto.condition_payload_json)
  const type = ruleTypeFor(dto.condition_type, payload)
  return {
    id: String(dto.id),
    name: dto.name,
    type,
    geozoneId: null,
    routeId: null,
    speedLimitKmh:
      type === "global_speeding" ? numberOrNull(payload.limit_kmh) : null,
    thresholdMinutes: type === "idle" ? numberOrNull(payload.minutes) : null,
    deviationMeters: null,
    vehicleIds: null,
    severity: SEVERITY_MAP[dto.severity] ?? "info",
    notify: { email: false, emailTo: "", sms: false, smsTo: "" },
    active: dto.active,
  }
}

/**
 * A fired-alert record from `GET /api/v1/alerts` (`data[]`) — the violation feed,
 * distinct from the alert *rule* that produced it. The sample response carried an
 * empty `data` array, so this shape is a best-guess at the backend's snake_case
 * fields; the mapper reads every field defensively (all optional/nullable) so a
 * naming mismatch degrades a single column rather than throwing. Confirm against
 * a real payload and tighten as needed.
 */
export interface AlertResponse {
  id: number | string
  alert_type: string
  status: string
  severity: string
  vehicle_id?: number | string | null
  plate_number?: string | null
  message?: string | null
  description?: string | null
  latitude?: number | null
  longitude?: number | null
  // GEOFENCE alerts carry a direction so entry vs exit can be resolved.
  direction?: string | null
  geofence_name?: string | null
  route_name?: string | null
  // Provider/owner — surfaces the entity for the page's provider filter.
  provider?: string | null
  stakeholder_id?: number | string | null
  creation_time?: string | null
  triggered_at?: string | null
  acknowledged_by?: string | null
  acknowledged_at?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  resolution_note?: string | null
}

// Backend alert_type → the app's EventType (for the row's displayed kind). Mirrors
// `ruleTypeFor` but targets EventType: SPEED is a fired "speeding" event (not the
// rule-level "global_speeding"), GEOFENCE splits on direction, IGNITION has no
// scope-based equivalent so it uses the dedicated "ignition" bucket.
function alertTypeToEventType(
  alertType: string,
  direction?: string | null
): EventType {
  switch (alertType) {
    case "SPEED":
      return "speeding"
    case "GEOFENCE":
      return direction === "OUTSIDE" ? "exit" : "entry"
    case "TIME_AND_DISTANCE":
      return "idle"
    case "IGNITION":
      return "ignition"
    default:
      return "ignition"
  }
}

// Backend alert status (3 values) → the app's EventStatus. The app's "escalated"
// has no backend equivalent, and the backend's "RESOLVED" maps onto "closed".
const ALERT_STATUS_MAP: Record<string, EventStatus> = {
  OPEN: "open",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "closed",
}

/**
 * Map an `AlertResponse` onto the app's `FleetEvent`. Fields the endpoint doesn't
 * carry (geozone/route ids, the escalation leg) get null; lat/lng fall back to
 * Addis when absent so the map overlay still renders. `read` is derived from
 * status (OPEN reads as unread) since alerts have no separate read flag.
 */
export function mapAlertResponse(dto: AlertResponse): FleetEvent {
  const status = ALERT_STATUS_MAP[dto.status] ?? "open"
  const at = dto.triggered_at ?? dto.creation_time ?? new Date().toISOString()
  const lat = numberOrNull(dto.latitude)
  const lng = numberOrNull(dto.longitude)
  const location: LatLng =
    lat !== null && lng !== null ? { lat, lng } : { ...ADDIS }
  const vehicleId = dto.vehicle_id != null ? String(dto.vehicle_id) : ""
  return {
    id: String(dto.id),
    type: alertTypeToEventType(dto.alert_type, dto.direction),
    severity: SEVERITY_MAP[dto.severity] ?? "info",
    vehicleId,
    vehiclePlate: dto.plate_number ?? (vehicleId ? `#${vehicleId}` : "—"),
    entityId:
      dto.provider ??
      (dto.stakeholder_id != null ? String(dto.stakeholder_id) : ""),
    geozoneId: null,
    geozoneName: dto.geofence_name ?? null,
    routeId: null,
    routeName: dto.route_name ?? null,
    message: dto.message ?? dto.description ?? "—",
    at,
    location,
    read: dto.status !== "OPEN",
    status,
    acknowledgedBy: dto.acknowledged_by ?? null,
    acknowledgedAt: dto.acknowledged_at ?? null,
    escalatedTo: null,
    escalatedAt: null,
    closedBy: dto.resolved_by ?? null,
    closedAt: dto.resolved_at ?? null,
    resolutionNote: dto.resolution_note ?? null,
  }
}

/**
 * A route record from `GET /api/v1/routes` (`data[]`). The backend stores the
 * corridor geometry as a *stringified* GeoJSON LineString (`route_geojson`,
 * `[lng, lat]` pairs) plus a start/end address — there is no named-waypoint
 * concept, so the app synthesizes two display waypoints from the endpoints.
 */
export interface RouteResponse {
  id: number
  stakeholder_id: number | null
  name: string
  description: string | null
  start_address: string | null
  end_address: string | null
  route_geojson: string | null
  distance_km: number | null
  active: boolean
  assigned_itinerary_count: number | null
  creation_time: string | null
  time_last_modified: string | null
}

/**
 * Map a `RouteResponse` onto the app's `RouteDef`. `route_geojson` becomes the
 * render/simulation `path`; the start/end addresses name two display waypoints
 * pinned to the path endpoints so `RouteDetailPanel`/`RoutePolyline` keep
 * rendering. Backend distance is used as-is (the app's haversine length is only
 * the fallback when it's absent).
 */
export function mapRouteResponse(dto: RouteResponse): RouteDef {
  const path = lineStringToPath(dto.route_geojson)
  const startAddress = dto.start_address ?? ""
  const endAddress = dto.end_address ?? ""
  const waypoints: Waypoint[] = []
  if (path.length > 0) {
    waypoints.push({
      id: `rte-${dto.id}-start`,
      name: startAddress || "Start",
      position: path[0]!,
    })
    if (path.length > 1) {
      waypoints.push({
        id: `rte-${dto.id}-end`,
        name: endAddress || "End",
        position: path[path.length - 1]!,
      })
    }
  }
  const created = dto.creation_time ?? new Date().toISOString()
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description ?? "",
    path,
    waypoints,
    distanceKm: dto.distance_km ?? pathLengthKm(path),
    active: dto.active,
    createdAt: created,
    startAddress,
    endAddress,
    assignedItineraryCount: dto.assigned_itinerary_count ?? undefined,
  }
}

/** `GeozoneResponse` from `GET /api/v1/geozones` (`data[]`). */
export interface GeozoneResponse {
  id: number
  stakeholder_id: number | null
  name: string
  description: string | null
  /** "CIRCLE" | "POLYGON" */
  shape_type: string | null
  /** GeoJSON Polygon string (polygons only). */
  boundary_geojson: string | null
  center_lat: number | null
  center_lng: number | null
  radius_m: number | null
  address: string | null
  status: string | null
  color_hex: string | null
  creation_time: string | null
  time_last_modified: string | null
}

/**
 * Map a `GeozoneResponse` onto the app's `Geozone`. Polygons carry their vertices
 * in `boundary_geojson`; circles carry `center_*` + `radius_m`. `visible`/`isPOI`/
 * `groupId` have no backend column, so they default to sensible UI values (the
 * group concept is mock-only). `color_hex` becomes the per-zone draw color.
 */
export function mapGeozoneResponse(dto: GeozoneResponse): Geozone {
  const shape: GeozoneShape =
    dto.shape_type?.toUpperCase() === "POLYGON" ? "polygon" : "circle"
  const path = shape === "polygon" ? geoJsonToPolygonPath(dto.boundary_geojson) : null
  const center: LatLng =
    dto.center_lat != null && dto.center_lng != null
      ? { lat: dto.center_lat, lng: dto.center_lng }
      : path && path.length > 0
        ? centroidOf(path)
        : { lat: 0, lng: 0 }
  const created = dto.creation_time ?? new Date().toISOString()
  return {
    id: String(dto.id),
    name: dto.name,
    shape,
    center,
    radiusM: shape === "circle" ? (dto.radius_m ?? null) : null,
    path,
    address: dto.address ?? "",
    groupId: null,
    color: dto.color_hex ?? undefined,
    visible: true,
    isPOI: false,
    note: dto.description ?? "",
    createdAt: created,
  }
}
