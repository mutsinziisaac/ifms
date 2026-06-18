// Adapters from backend wire DTOs (snake_case, per the OpenAPI spec) to the
// app's domain model. Kept separate from api.ts so the transforms stay pure and
// the call layer stays focused on orchestration.

import type {
  ItmsVerificationStatus,
  Provider,
  Vehicle,
  VehicleStatus,
  VehicleType,
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
 * .data[]`). Identity + lifecycle only — no name/category/region/contact.
 */
export interface ProviderResponse {
  id: number
  provider_code: string | null
  active: boolean
  creation_time: string | null
  time_last_modified: string | null
}

/** Map a `ProviderResponse` onto the app's lean `Provider`. */
export function mapProviderResponse(dto: ProviderResponse): Provider {
  const created = dto.creation_time ?? new Date().toISOString()
  return {
    id: String(dto.id),
    code: dto.provider_code ?? `#${dto.id}`,
    active: dto.active,
    createdAt: created,
    modifiedAt: dto.time_last_modified ?? created,
  }
}
