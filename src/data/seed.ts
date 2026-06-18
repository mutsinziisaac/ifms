// Seeded, stable, realistic Ethiopian fleet-monitoring data for the IFMS
// prototype. A fixed-seed PRNG keeps the data identical across reloads while
// timestamps are anchored to the live clock so "x min ago" reads fresh.

import {
  centroidOf,
  haversineKm,
  headingBetween,
  interpolateAlongPath,
  isInsideGeozone,
  pathLengthKm,
  pointInPolygon,
} from "@/lib/maps"
import {
  ESCALATION_TARGETS,
  ETHIOPIA_REGIONS,
  GPS_PROVIDERS,
  INCIDENT_ROOT_CAUSES,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  VEHICLE_TYPES,
  type AccidentRecord,
  type DB,
  type Entity,
  type EntityCategory,
  type EventRule,
  type EventRuleType,
  type EventSeverity,
  type EventStatus,
  type EventType,
  type FleetEvent,
  type IncidentSeverity,
  type ItmsVerificationStatus,
  type Permission,
  type PermissionAction,
  type PermissionModule,
  type ProviderTelemetry,
  type Role,
  type RoleType,
  type WebUser,
  type WebUserStatus,
  type ZoneRuleType,
  type EthiopiaRegion,
  type Geozone,
  type GeozoneGroup,
  type LatLng,
  type RouteDef,
  type Trip,
  type Vehicle,
  type VehicleType,
  type Waypoint,
} from "@/data/types"
import {
  densifyPath,
  placeByName,
  nearestPlaceName,
  PLACES,
  ROUTE_BLUEPRINTS,
} from "@/data/geo"
import { FACILITY_FOOTPRINTS, ROAD_GEOMETRY } from "@/data/geo-real"

// ---------------------------------------------------------------------------
// Deterministic PRNG + helpers
// ---------------------------------------------------------------------------

const SEED = 0x4d6f544c // "MoTL"

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Rng {
  next: () => number
  int: (minIncl: number, maxIncl: number) => number
  float: (min: number, max: number) => number
  pick: <T>(arr: readonly T[]) => T
  bool: (pTrue?: number) => boolean
  jitter: (p: LatLng, deg: number) => LatLng
}

function makeRng(seed: number): Rng {
  const next = mulberry32(seed)
  const float = (min: number, max: number) => min + next() * (max - min)
  const int = (minIncl: number, maxIncl: number) =>
    Math.floor(float(minIncl, maxIncl + 1))
  const pick = <T>(arr: readonly T[]): T => arr[int(0, arr.length - 1)]!
  const bool = (pTrue = 0.5) => next() < pTrue
  const jitter = (p: LatLng, deg: number): LatLng => ({
    lat: p.lat + (next() - 0.5) * 2 * deg,
    lng: p.lng + (next() - 0.5) * 2 * deg,
  })
  return { next, int, float, pick, bool, jitter }
}

// Time helpers — all relative to the live clock.
const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

function ago(ms: number, now: number): string {
  return new Date(now - ms).toISOString()
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0")
}

function round(n: number, digits = 0): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

// Nearest point on any *active* route to `p`, plus the local road bearing.
// Used to plant roadside compounds directly on the highway so the simulation
// (which moves vehicles strictly along route.path) drives through them and the
// geofence entry/exit/speeding rules keep firing.
function nearestOnRoutes(
  p: LatLng,
  routes: RouteDef[]
): { point: LatLng; bearing: number } {
  let bestPoint: LatLng = p
  let bestBearing = 0
  let bestKm = Infinity
  for (const r of routes) {
    if (!r.active) continue
    for (let i = 1; i < r.path.length; i++) {
      const a = r.path[i - 1]!
      const km = haversineKm(p, a)
      if (km < bestKm) {
        bestKm = km
        bestPoint = a
        bestBearing = headingBetween(a, r.path[i]!)
      }
    }
  }
  return { point: bestPoint, bearing: bestBearing }
}

// Irregular fenced-compound polygon for a roadside checkpoint / weighbridge /
// border post. Centered ON the road and elongated along the road bearing so the
// route runs lengthwise through it (vehicles enter one end, exit the other).
// `lengthM`/`widthM` are the along-road and across-road spans in metres.
function roadsideCompound(
  center: LatLng,
  bearingDeg: number,
  lengthM: number,
  widthM: number,
  rng: Rng
): LatLng[] {
  const theta = (bearingDeg * Math.PI) / 180
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const cosLat = Math.cos((center.lat * Math.PI) / 180)
  const toLatLng = (alongM: number, perpM: number): LatLng => {
    const north = alongM * cosT - perpM * sinT
    const east = alongM * sinT + perpM * cosT
    return {
      lat: center.lat + north / 111320,
      lng: center.lng + east / (111320 * cosLat),
    }
  }
  // Six vertices as fractions of the half-spans, lightly jittered so the
  // outline reads like a fenced yard rather than a rectangle.
  const base: [number, number][] = [
    [0.5, -0.32],
    [0.5, 0.32],
    [0.12, 0.5],
    [-0.5, 0.36],
    [-0.5, -0.36],
    [-0.12, -0.5],
  ]
  return base.map(([a, p]) => {
    const aj = a * (1 + (rng.next() - 0.5) * 0.24)
    const pj = p * (1 + (rng.next() - 0.5) * 0.24)
    return toLatLng(aj * lengthM, pj * widthM)
  })
}

// A point guaranteed to lie inside a polygon — the centroid when it is inside
// (convex shapes), otherwise a centroid→vertex midpoint. Used to park demo
// vehicles inside a facility footprint, which may be non-convex.
function interiorPoint(path: LatLng[]): LatLng {
  if (path.length < 3) return centroidOf(path)
  const c = centroidOf(path)
  if (pointInPolygon(c, path)) return c
  for (const f of [0.5, 0.25, 0.75, 0.1]) {
    for (const v of path) {
      const m = {
        lat: c.lat + (v.lat - c.lat) * f,
        lng: c.lng + (v.lng - c.lng) * f,
      }
      if (pointInPolygon(m, path)) return m
    }
  }
  return c
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

interface EntitySeed {
  name: string
  shortName: string
  category: EntityCategory
  domain: string
  address: string
  phone: string
  region: EthiopiaRegion
}

// The "providers" — government ministries and institutions whose fleets
// transmit device data to the MoTL platform. IDs stay ent-01..ent-09 so all
// vehicle links remain stable.
const ENTITY_SEEDS: EntitySeed[] = [
  {
    name: "Ministry of Health",
    shortName: "MoH",
    category: "ministry",
    domain: "moh.gov",
    address: "Sudan Street, Lideta, Addis Ababa",
    phone: "+251 11 551 7011",
    region: "Addis Ababa",
  },
  {
    name: "Ethiopian Roads Administration",
    shortName: "ERA",
    category: "agency",
    domain: "era.gov",
    address: "Ras Abebe Aregay Street, Lideta, Addis Ababa",
    phone: "+251 11 551 7170",
    region: "Addis Ababa",
  },
  {
    name: "Ministry of Agriculture",
    shortName: "MoA",
    category: "ministry",
    domain: "moa.gov",
    address: "Gurd Shola, Bole, Addis Ababa",
    phone: "+251 11 646 2633",
    region: "Addis Ababa",
  },
  {
    name: "Ethiopian Electric Power",
    shortName: "EEP",
    category: "enterprise",
    domain: "eep.com",
    address: "De Gaulle Square, Arada, Addis Ababa",
    phone: "+251 11 155 3066",
    region: "Addis Ababa",
  },
  {
    name: "Ethiopian Postal Service",
    shortName: "EthioPost",
    category: "enterprise",
    domain: "ethiopost",
    address: "Churchill Avenue, Arada, Addis Ababa",
    phone: "+251 11 551 0011",
    region: "Addis Ababa",
  },
  {
    name: "Ministry of Water & Energy",
    shortName: "MoWE",
    category: "ministry",
    domain: "mowe.gov",
    address: "Haile Gebrselassie Avenue, Bole, Addis Ababa",
    phone: "+251 11 661 1111",
    region: "Addis Ababa",
  },
  {
    name: "Ethiopian Customs Commission",
    shortName: "ECC",
    category: "agency",
    domain: "ecc.gov",
    address: "Eastern Corridor Branch, Jigjiga Road, Dire Dawa",
    phone: "+251 25 111 2299",
    region: "Dire Dawa",
  },
  {
    name: "Ministry of Education",
    shortName: "MoE",
    category: "ministry",
    domain: "moe.gov",
    address: "Arat Kilo, Arada, Addis Ababa",
    phone: "+251 11 155 3133",
    region: "Addis Ababa",
  },
  {
    name: "Disaster Risk Management Commission",
    shortName: "EDRMC",
    category: "agency",
    domain: "edrmc.gov",
    address: "Semera Corridor Road, Semera",
    phone: "+251 33 666 0190",
    region: "Afar",
  },
]

function buildEntities(): Entity[] {
  return ENTITY_SEEDS.map((e, i) => ({
    id: `ent-${pad(i + 1, 2)}`,
    name: e.name,
    shortName: e.shortName,
    category: e.category,
    address: e.address,
    phone: e.phone,
    email: `info@${e.domain}.et`,
    region: e.region,
  }))
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

function buildRoutes(rng: Rng, now: number): RouteDef[] {
  return ROUTE_BLUEPRINTS.map((bp, i) => {
    const places = bp.waypointNames.map((n) => placeByName(n))
    // Real road geometry baked from OSRM (src/data/geo-real.ts); the densified
    // straight-line path remains as a fallback if a route ever lacks real data.
    const real = ROAD_GEOMETRY[bp.name]
    const path = real
      ? real.map((p) => ({ ...p }))
      : densifyPath(places.map((p) => p.position))
    const waypoints: Waypoint[] = places.map((p, w) => ({
      id: `rte-${pad(i + 1, 2)}-wp-${pad(w + 1, 2)}`,
      name: p.name,
      position: p.position,
    }))
    return {
      id: `rte-${pad(i + 1, 2)}`,
      name: bp.name,
      description: bp.description,
      path,
      waypoints,
      distanceKm: round(pathLengthKm(path)),
      active: bp.name !== "Addis–Kombolcha Industrial",
      createdAt: ago(rng.float(30 * DAY, 360 * DAY), now),
    }
  })
}

// ---------------------------------------------------------------------------
// Geozones & groups
// ---------------------------------------------------------------------------

// Every geozone is now a polygon. Large facilities trace their real OSM
// footprint (FACILITY_FOOTPRINTS); roadside checkpoints / weighbridges / border
// posts are generated as irregular compounds straddling the real road so the
// simulation still drives vehicles through them. Order is preserved so ids stay
// geo-01..geo-12 across the rest of the seed.
interface ZoneSeed {
  name: string
  place: string
  kind: "footprint" | "compound"
  // Along-road / across-road spans in metres (compound zones only).
  lengthM?: number
  widthM?: number
  note: string
}

const ZONE_SEEDS: ZoneSeed[] = [
  {
    name: "Modjo Dry Port",
    place: "Modjo",
    kind: "footprint",
    note: "Primary inland container depot for the Djibouti corridor.",
  },
  {
    name: "Adama Weighbridge",
    place: "Adama",
    kind: "compound",
    // Compounds are irregular yards straddling the carriageway, elongated along
    // the road. They are sized a few km across — comparable to the old circles —
    // so the discrete simulation (which can advance several km per tick at higher
    // speeds) reliably samples a vehicle inside and keeps the geofence rules
    // firing. Spans were tuned against the real road geometry (scripts/fetch-geo).
    lengthM: 2600,
    widthM: 1200,
    note: "Mandatory axle-load weighing for outbound freight.",
  },
  {
    name: "Awash Checkpoint",
    place: "Awash",
    kind: "compound",
    lengthM: 2800,
    widthM: 1200,
    note: "Federal police checkpoint and corridor rest stop.",
  },
  {
    name: "Mille Checkpoint",
    place: "Mille",
    kind: "compound",
    lengthM: 3000,
    widthM: 1300,
    note: "Customs control point on the Afar corridor.",
  },
  {
    name: "Dewele Border Post",
    place: "Dewele",
    kind: "compound",
    lengthM: 3200,
    widthM: 1300,
    note: "Ethiopia–Djibouti land border crossing near the railway.",
  },
  {
    name: "Kality Customs Terminal",
    place: "Kality",
    kind: "footprint",
    note: "Addis Ababa customs clearance and bonded warehouse area.",
  },
  {
    name: "Hawassa Industrial Park",
    place: "Hawassa",
    kind: "footprint",
    note: "Export-oriented manufacturing park served by corridor freight.",
  },
  {
    name: "Galafi Border Crossing",
    place: "Galafi",
    kind: "compound",
    lengthM: 3600,
    widthM: 1400,
    note: "Main road border crossing into Djibouti.",
  },
  {
    name: "Dire Dawa Freight Depot",
    place: "Dire Dawa",
    kind: "footprint",
    note: "Rail-linked freight consolidation depot.",
  },
  {
    name: "Port of Djibouti Terminal",
    place: "Djibouti City",
    kind: "footprint",
    note: "Doraleh multipurpose port terminal — corridor destination.",
  },
  {
    name: "Addis Ababa Ring Road Zone",
    place: "Addis Ababa",
    kind: "footprint",
    note: "City restricted-access zone bounded by the ring road.",
  },
  {
    name: "Semera Logistics Hub",
    place: "Semera",
    kind: "footprint",
    note: "Afar regional logistics and staging hub.",
  },
]

interface BuiltGeozones {
  geozones: Geozone[]
  groups: GeozoneGroup[]
  byName: Map<string, Geozone>
}

function buildGeozones(
  rng: Rng,
  routes: RouteDef[],
  now: number
): BuiltGeozones {
  const groups: GeozoneGroup[] = [
    { id: "grp-01", name: "Border Crossings", color: "#f59e0b" },
    { id: "grp-02", name: "Dry Ports & Terminals", color: "#0ea5e9" },
    { id: "grp-03", name: "Checkpoints & Weighbridges", color: "#8b5cf6" },
  ]

  // name -> groupId membership
  const groupOf: Record<string, string> = {
    "Galafi Border Crossing": "grp-01",
    "Dewele Border Post": "grp-01",
    "Modjo Dry Port": "grp-02",
    "Kality Customs Terminal": "grp-02",
    "Port of Djibouti Terminal": "grp-02",
    "Dire Dawa Freight Depot": "grp-02",
    "Awash Checkpoint": "grp-03",
    "Mille Checkpoint": "grp-03",
    "Adama Weighbridge": "grp-03",
  }

  const geozones: Geozone[] = []
  let n = 0

  for (const z of ZONE_SEEDS) {
    n++
    const anchor = placeByName(z.place).position
    const footprint = FACILITY_FOOTPRINTS[z.name]
    let path: LatLng[]
    if (z.kind === "footprint" && footprint && footprint.length >= 3) {
      // Real OSM facility outline (cloned so it is never mutated in place).
      path = footprint.map((p) => ({ ...p }))
    } else {
      // Roadside compound planted on the nearest real road. Footprint zones
      // missing OSM data fall back here too (slightly larger default size).
      const { point, bearing } = nearestOnRoutes(anchor, routes)
      path = roadsideCompound(
        point,
        bearing,
        z.lengthM ?? 2600,
        z.widthM ?? 600,
        rng
      )
    }
    const center = centroidOf(path)
    geozones.push({
      id: `geo-${pad(n, 2)}`,
      name: z.name,
      shape: "polygon",
      center,
      radiusM: null,
      path,
      address: nearestPlaceName(center),
      groupId: groupOf[z.name] ?? null,
      visible: true,
      isPOI: true,
      note: z.note,
      createdAt: ago(rng.float(60 * DAY, 360 * DAY), now),
    })
  }

  const byName = new Map(geozones.map((g) => [g.name, g]))
  return { geozones, groups, byName }
}

// ---------------------------------------------------------------------------
// Event rules
// ---------------------------------------------------------------------------

const RULE_NAME: Record<EventRuleType, string> = {
  entry: "entry",
  exit: "exit",
  speeding: "speed limit",
  route_deviation: "route deviation",
  global_speeding: "Fleet speed limit",
  idle: "Excessive idle",
  no_signal: "Signal loss",
  ignition: "Ignition",
}

/** Fresh in-app-only notification config (each rule gets its own object). */
function defaultNotify() {
  return { email: false, emailTo: "", sms: false, smsTo: "" }
}

function buildEventRules(
  byName: Map<string, Geozone>,
  routes: RouteDef[]
): EventRule[] {
  const rules: EventRule[] = []
  let n = 0
  const add = (
    zoneName: string,
    type: ZoneRuleType,
    speedLimitKmh: number | null,
    severity: EventSeverity,
    active: boolean
  ) => {
    const zone = byName.get(zoneName)
    if (!zone) return
    n++
    rules.push({
      id: `rule-${pad(n, 2)}`,
      name: `${zone.name} ${RULE_NAME[type]}`,
      geozoneId: zone.id,
      routeId: null,
      type,
      speedLimitKmh,
      thresholdMinutes: null,
      deviationMeters: null,
      vehicleIds: null,
      severity,
      notify: defaultNotify(),
      active,
    })
  }

  // Entry + exit for every border crossing and dry port / terminal.
  const entryExitZones = [
    "Galafi Border Crossing",
    "Dewele Border Post",
    "Modjo Dry Port",
    "Kality Customs Terminal",
    "Port of Djibouti Terminal",
    "Dire Dawa Freight Depot",
  ]
  for (const z of entryExitZones) {
    add(z, "entry", null, "info", true)
    add(z, "exit", null, "info", true)
  }

  // Speeding rules at the three checkpoint zones.
  for (const z of [
    "Awash Checkpoint",
    "Mille Checkpoint",
    "Adama Weighbridge",
  ]) {
    add(z, "speeding", 80, "warning", true)
  }

  // Deactivated entry rule for Hawassa Industrial Park (demonstrates toggle).
  add("Hawassa Industrial Park", "entry", null, "info", false)

  // Route-deviation rules on the busiest active corridors.
  for (const route of routes.filter((r) => r.active).slice(0, 2)) {
    n++
    rules.push({
      id: `rule-${pad(n, 2)}`,
      name: `${route.name} deviation`,
      geozoneId: null,
      routeId: route.id,
      type: "route_deviation",
      speedLimitKmh: null,
      thresholdMinutes: null,
      deviationMeters: 800,
      vehicleIds: null,
      severity: "warning",
      notify: defaultNotify(),
      active: true,
    })
  }

  // Fleet-wide rules (geozoneId/routeId null).
  const addGlobal = (
    type: EventRule["type"],
    speedLimitKmh: number | null,
    thresholdMinutes: number | null,
    severity: EventSeverity
  ) => {
    n++
    rules.push({
      id: `rule-${pad(n, 2)}`,
      name: RULE_NAME[type],
      geozoneId: null,
      routeId: null,
      type,
      speedLimitKmh,
      thresholdMinutes,
      deviationMeters: null,
      vehicleIds: null,
      severity,
      notify: defaultNotify(),
      active: true,
    })
  }
  addGlobal("global_speeding", 100, null, "warning")
  addGlobal("idle", null, 45, "info")
  addGlobal("no_signal", null, 30, "warning")

  return rules
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

interface ModelSeed {
  description: string
  types: VehicleType[]
}

const MODELS: ModelSeed[] = [
  { description: "Sinotruk Howo A7 dry cargo", types: ["truck", "container"] },
  {
    description: "Mercedes-Benz Actros 2645 tractor",
    types: ["truck", "trailer"],
  },
  {
    description: "Scania G460 prime mover",
    types: ["truck", "trailer", "container"],
  },
  { description: "Volvo FH 460 tractor unit", types: ["truck", "trailer"] },
  { description: "Isuzu FVR cargo body", types: ["truck", "pickup"] },
  { description: "FAW J6P heavy hauler", types: ["truck", "container"] },
  { description: "Hyundai Xcient tractor", types: ["truck", "trailer"] },
  { description: "Renault K440 tipper", types: ["truck"] },
  {
    description: "DAF XF 480 tractor",
    types: ["truck", "trailer", "container"],
  },
  { description: "Sinotruk Howo fuel tanker", types: ["tanker"] },
  { description: "Mercedes-Benz Actros 3340 tanker", types: ["tanker"] },
  { description: "Scania P410 fuel bowser", types: ["tanker"] },
  { description: "Yutong ZK6122 coach", types: ["bus"] },
  { description: "Higer KLQ6129 intercity bus", types: ["bus"] },
  { description: "Toyota Hilux double-cab", types: ["pickup"] },
  { description: "Isuzu D-Max utility", types: ["pickup"] },
  { description: "Toyota Corolla saloon", types: ["saloon"] },
  { description: "Hyundai Accent saloon", types: ["saloon"] },
  { description: "Toyota Land Cruiser 4x4", types: ["suv"] },
  { description: "Toyota Land Cruiser Prado", types: ["suv"] },
  { description: "Toyota HiAce minibus", types: ["minibus"] },
  { description: "Hyundai H-1 panel van", types: ["van"] },
]

function modelFor(type: VehicleType, rng: Rng): string {
  const candidates = MODELS.filter((m) => m.types.includes(type))
  const pool = candidates.length > 0 ? candidates : MODELS
  return rng.pick(pool).description
}

function plate(rng: Rng): string {
  const code = rng.int(1, 4)
  const digits = pad(rng.int(0, 99999), 5)
  return `${code}-${digits} ET`
}

// Type distribution (48 total): 14 truck, 6 trailer, 5 tanker, 5 container,
// 4 bus, 4 pickup, 4 saloon, 3 suv, 2 minibus, 1 van.
function buildTypePool(): VehicleType[] {
  const counts: Record<VehicleType, number> = {
    truck: 14,
    trailer: 6,
    tanker: 5,
    container: 5,
    bus: 4,
    pickup: 4,
    saloon: 4,
    suv: 3,
    minibus: 2,
    van: 1,
  }
  const pool: VehicleType[] = []
  for (const t of VEHICLE_TYPES) {
    for (let i = 0; i < counts[t]; i++) pool.push(t)
  }
  return pool
}

interface BuiltVehicles {
  vehicles: Vehicle[]
}

function buildVehicles(
  rng: Rng,
  routes: RouteDef[],
  geozones: Geozone[],
  now: number
): BuiltVehicles {
  const typePool = buildTypePool() // 48 entries
  const activeRoutes = routes.filter((r) => r.active)
  // Weight the two Djibouti corridors heavily.
  const routeWeighted: RouteDef[] = []
  for (const r of activeRoutes) {
    let weight = 1
    if (r.name === "Addis–Djibouti Corridor (North)") weight = 5
    else if (r.name === "Addis–Djibouti via Dire Dawa") weight = 4
    else weight = 2
    for (let i = 0; i < weight; i++) routeWeighted.push(r)
  }

  const vehicles: Vehicle[] = []
  const modjoZone = geozones.find((g) => g.name === "Modjo Dry Port")!
  const kalityZone = geozones.find((g) => g.name === "Kality Customs Terminal")!

  let idx = 0
  const newVehicle = (
    type: VehicleType,
    status: Vehicle["status"],
    position: LatLng,
    heading: number,
    speedKmh: number,
    routeId: string | null,
    routeProgress: number,
    routeDir: 1 | -1,
    statusSinceMs: number,
    lastSyncMs: number
  ): Vehicle => {
    idx++
    // ITMS verification: the whole seeded fleet starts UNVERIFIED (not yet
    // checked against the ITMS registry). Advance the RNG regardless so the rest
    // of the seeded vehicle fields stay reproducible offline.
    rng.next()
    const itmsVerificationStatus: ItmsVerificationStatus = "UNVERIFIED"
    return {
      id: `veh-${pad(idx, 3)}`,
      plate: plate(rng),
      type,
      description: modelFor(type, rng),
      entityId: `ent-${pad(rng.int(1, ENTITY_SEEDS.length), 2)}`,
      region: rng.pick(ETHIOPIA_REGIONS),
      gpsProvider: rng.pick(GPS_PROVIDERS),
      status,
      statusSince: ago(statusSinceMs, now),
      position,
      heading,
      speedKmh: round(speedKmh),
      odometerKm: rng.int(40000, 600000),
      fuelPct: rng.int(15, 95),
      lastSyncAt: ago(lastSyncMs, now),
      routeId,
      insideGeozoneId: null,
      createdAt: ago(rng.float(30 * DAY, 2 * 365 * DAY), now),
      itmsVerificationStatus,
      routeProgress,
      routeDir,
    }
  }

  let ti = 0 // type pool cursor
  const nextType = (): VehicleType => typePool[ti++]!

  // 28 moving, routed vehicles.
  for (let i = 0; i < 28; i++) {
    const route = rng.pick(routeWeighted)
    const progress = rng.next()
    const dir: 1 | -1 = rng.bool() ? 1 : -1
    const interp = interpolateAlongPath(route.path, progress)
    const heading = dir === 1 ? interp.heading : (interp.heading + 180) % 360
    vehicles.push(
      newVehicle(
        nextType(),
        "moving",
        interp.position,
        round(heading),
        rng.float(45, 85),
        route.id,
        progress,
        dir,
        rng.float(20 * MIN, 6 * HOUR),
        rng.float(5 * 1000, 90 * 1000)
      )
    )
  }

  // 12 idling / ignition_off parked near random places.
  for (let i = 0; i < 12; i++) {
    const place = rng.pick(PLACES)
    const status: Vehicle["status"] = rng.bool(0.5) ? "idling" : "ignition_off"
    vehicles.push(
      newVehicle(
        nextType(),
        status,
        rng.jitter(place.position, 0.03),
        round(rng.float(0, 360)),
        0,
        null,
        0,
        1,
        rng.float(30 * MIN, 12 * HOUR),
        rng.float(10 * 1000, 4 * MIN)
      )
    )
  }

  // 3 no_signal (lastSync 2–8h ago) parked near places.
  for (let i = 0; i < 3; i++) {
    const place = rng.pick(PLACES)
    vehicles.push(
      newVehicle(
        nextType(),
        "no_signal",
        rng.jitter(place.position, 0.03),
        round(rng.float(0, 360)),
        0,
        null,
        0,
        1,
        rng.float(2 * HOUR, 8 * HOUR),
        rng.float(2 * HOUR, 8 * HOUR)
      )
    )
  }

  // 2 ignition_blocked.
  for (let i = 0; i < 2; i++) {
    const place = rng.pick(PLACES)
    vehicles.push(
      newVehicle(
        nextType(),
        "ignition_blocked",
        rng.jitter(place.position, 0.03),
        round(rng.float(0, 360)),
        0,
        null,
        0,
        1,
        rng.float(1 * HOUR, 24 * HOUR),
        rng.float(30 * 1000, 5 * MIN)
      )
    )
  }

  // 3 ignition_off at depots — 2 of them parked inside zones for coverage.
  // veh inside Modjo Dry Port:
  vehicles.push(
    newVehicle(
      nextType(),
      "ignition_off",
      rng.jitter(interiorPoint(modjoZone.path ?? [modjoZone.center]), 0.0008),
      round(rng.float(0, 360)),
      0,
      null,
      0,
      1,
      rng.float(2 * HOUR, 18 * HOUR),
      rng.float(20 * 1000, 3 * MIN)
    )
  )
  // veh inside Kality Customs Terminal:
  vehicles.push(
    newVehicle(
      nextType(),
      "ignition_off",
      rng.jitter(interiorPoint(kalityZone.path ?? [kalityZone.center]), 0.0008),
      round(rng.float(0, 360)),
      0,
      null,
      0,
      1,
      rng.float(2 * HOUR, 18 * HOUR),
      rng.float(20 * 1000, 3 * MIN)
    )
  )
  // one more ignition_off near a place:
  {
    const place = rng.pick(PLACES)
    vehicles.push(
      newVehicle(
        nextType(),
        "ignition_off",
        rng.jitter(place.position, 0.02),
        round(rng.float(0, 360)),
        0,
        null,
        0,
        1,
        rng.float(2 * HOUR, 18 * HOUR),
        rng.float(20 * 1000, 3 * MIN)
      )
    )
  }

  // Compute insideGeozoneId for every vehicle.
  for (const v of vehicles) {
    const zone = geozones.find((g) => isInsideGeozone(v.position, g))
    v.insideGeozoneId = zone ? zone.id : null
  }

  return { vehicles }
}

// ---------------------------------------------------------------------------
// Trips
// ---------------------------------------------------------------------------

function buildTrips(
  rng: Rng,
  vehicles: Vehicle[],
  routes: RouteDef[],
  now: number
): Trip[] {
  const routeById = new Map(routes.map((r) => [r.id, r]))
  const routed = vehicles.filter((v) => v.routeId !== null).slice(0, 18)
  const trips: Trip[] = []
  let n = 0

  for (const v of routed) {
    const route = routeById.get(v.routeId!)
    if (!route) continue
    const tripCount = rng.int(3, 5)
    for (let t = 0; t < tripCount; t++) {
      n++
      const pathLen = route.path.length
      // Contiguous slice covering a meaningful fraction of the route.
      const sliceLen = Math.max(4, Math.floor(pathLen * rng.float(0.35, 0.9)))
      const maxStart = Math.max(0, pathLen - sliceLen)
      const start = rng.int(0, maxStart)
      let slice = route.path.slice(start, start + sliceLen)
      const reversed = rng.bool(0.5)
      if (reversed) slice = [...slice].reverse()

      const distanceKm = round(pathLengthKm(slice), 1)
      const avgSpeedKmh = round(rng.float(40, 70))
      const maxSpeedKmh = round(avgSpeedKmh + rng.float(10, 25))
      const durationHrs = distanceKm / Math.max(1, avgSpeedKmh)
      // End within the past 30 days; start = end - duration.
      const endMs = now - rng.float(1 * HOUR, 30 * DAY)
      const startMs = endMs - durationHrs * HOUR

      trips.push({
        id: `trp-${pad(n, 3)}`,
        vehicleId: v.id,
        routeId: route.id,
        startAt: new Date(startMs).toISOString(),
        endAt: new Date(endMs).toISOString(),
        startAddress: nearestPlaceName(slice[0]!),
        endAddress: nearestPlaceName(slice[slice.length - 1]!),
        distanceKm,
        avgSpeedKmh,
        maxSpeedKmh,
        path: slice,
      })
    }
  }

  // Newest first.
  trips.sort((a, b) => +new Date(b.endAt) - +new Date(a.endAt))
  return trips
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const RESOLUTION_NOTES = [
  "Verified with the operator — vehicle cleared to proceed.",
  "Driver contacted; warning issued and logged on file.",
  "Confirmed scheduled stop at the terminal. No action needed.",
  "Device reconnected after a SIM reset by the GPS provider.",
  "Checkpoint transit confirmed against the trip manifest.",
]

function buildEvents(
  rng: Rng,
  vehicles: Vehicle[],
  geozones: Geozone[],
  now: number
): FleetEvent[] {
  const byName = new Map(geozones.map((g) => [g.name, g]))
  const corridorZones = [
    "Modjo Dry Port",
    "Adama Weighbridge",
    "Awash Checkpoint",
    "Mille Checkpoint",
    "Galafi Border Crossing",
    "Dewele Border Post",
    "Kality Customs Terminal",
    "Dire Dawa Freight Depot",
    "Port of Djibouti Terminal",
  ]
  const checkpointZones = [
    "Awash Checkpoint",
    "Mille Checkpoint",
    "Adama Weighbridge",
  ]

  const pickVehicle = () => rng.pick(vehicles)

  interface Spec {
    type: EventType
    severity: EventSeverity
    zoneName: string | null
  }

  const specs: Spec[] = []
  // 15 entry/exit at corridor zones (info).
  for (let i = 0; i < 15; i++) {
    specs.push({
      type: rng.bool(0.5) ? "entry" : "exit",
      severity: "info",
      zoneName: rng.pick(corridorZones),
    })
  }
  // 5 speeding: 3 warning, 2 critical (>100 km/h).
  for (let i = 0; i < 3; i++) {
    specs.push({
      type: "speeding",
      severity: "warning",
      zoneName: rng.pick(checkpointZones),
    })
  }
  for (let i = 0; i < 2; i++) {
    specs.push({
      type: "speeding",
      severity: "critical",
      zoneName: rng.pick(checkpointZones),
    })
  }
  // 2 no_signal (warning), 2 idle (info).
  for (let i = 0; i < 2; i++) {
    specs.push({ type: "no_signal", severity: "warning", zoneName: null })
  }
  for (let i = 0; i < 2; i++) {
    specs.push({ type: "idle", severity: "info", zoneName: null })
  }

  // Assign timestamps spread over the last 48h.
  const events: FleetEvent[] = specs.map((spec, i) => {
    const v = pickVehicle()
    const zone = spec.zoneName ? (byName.get(spec.zoneName) ?? null) : null
    const atMs = now - rng.float(2 * MIN, 48 * HOUR)
    const location = zone
      ? rng.jitter(zone.center, 0.004)
      : rng.jitter(v.position, 0.01)
    let message: string
    if (spec.type === "entry") {
      message = `${v.plate} entered ${zone?.name ?? "a geozone"}`
    } else if (spec.type === "exit") {
      message = `${v.plate} exited ${zone?.name ?? "a geozone"}`
    } else if (spec.type === "speeding") {
      const sp =
        spec.severity === "critical"
          ? round(rng.float(101, 124))
          : round(rng.float(85, 99))
      message = `${v.plate} exceeded the speed limit (${sp} km/h) near ${zone?.name ?? "the corridor"}`
    } else if (spec.type === "no_signal") {
      message = `${v.plate} lost GPS signal`
    } else {
      message = `${v.plate} idling beyond the allowed threshold`
    }
    // Workflow status by age: older events are mostly handled, fresh ones
    // mostly open — gives the Events workspace a believable mix.
    const ageMs = now - atMs
    let status: EventStatus
    if (ageMs > 24 * HOUR) {
      status = rng.bool(0.8) ? "closed" : "acknowledged"
    } else if (ageMs > 12 * HOUR) {
      status = rng.bool(0.45)
        ? "acknowledged"
        : rng.bool(0.5)
          ? "escalated"
          : "open"
    } else {
      status = rng.bool(0.75) ? "open" : "acknowledged"
    }

    const handled = status !== "open"
    const acknowledgedAt = handled
      ? new Date(atMs + rng.float(0.05, 0.3) * ageMs).toISOString()
      : null
    const escalatedAt =
      status === "escalated"
        ? new Date(atMs + rng.float(0.3, 0.6) * ageMs).toISOString()
        : null
    const closedAt =
      status === "closed"
        ? new Date(atMs + rng.float(0.5, 0.9) * ageMs).toISOString()
        : null

    return {
      id: `evt-${pad(i + 1, 3)}`,
      type: spec.type,
      severity: spec.severity,
      vehicleId: v.id,
      vehiclePlate: v.plate,
      entityId: v.entityId,
      geozoneId: zone?.id ?? null,
      geozoneName: zone?.name ?? null,
      routeId: null,
      routeName: null,
      message,
      at: new Date(atMs).toISOString(),
      location,
      read: handled || ageMs > 12 * HOUR,
      status,
      acknowledgedBy: handled ? "Operations Center" : null,
      acknowledgedAt,
      escalatedTo: status === "escalated" ? rng.pick(ESCALATION_TARGETS) : null,
      escalatedAt,
      closedBy: status === "closed" ? "Operations Center" : null,
      closedAt,
      resolutionNote: status === "closed" ? rng.pick(RESOLUTION_NOTES) : null,
    }
  })

  // Newest first, then renumber ids so they read sequentially.
  events.sort((a, b) => +new Date(b.at) - +new Date(a.at))
  events.forEach((e, i) => {
    e.id = `evt-${pad(i + 1, 3)}`
  })
  return events
}

// ---------------------------------------------------------------------------
// Provider telemetry baseline
// ---------------------------------------------------------------------------

function buildProviderTelemetry(
  rng: Rng,
  entities: Entity[],
  vehicles: Vehicle[]
): ProviderTelemetry[] {
  return entities.map((e) => {
    const fleet = vehicles.filter((v) => v.entityId === e.id)
    const transmitting = fleet.filter((v) => v.status !== "no_signal").length
    const history: number[] = []
    for (let i = 0; i < 40; i++) {
      history.push(
        Math.max(0, Math.min(fleet.length, transmitting + rng.int(-2, 1)))
      )
    }
    return {
      entityId: e.id,
      messagesTotal: fleet.length * rng.int(1800, 4200),
      history,
    }
  })
}

// ---------------------------------------------------------------------------
// Accident / incident records (SRS Safety & Incident Dashboard)
// ---------------------------------------------------------------------------

function buildAccidents(
  rng: Rng,
  vehicles: Vehicle[],
  now: number
): AccidentRecord[] {
  const records: AccidentRecord[] = []
  const count = 16

  for (let i = 0; i < count; i++) {
    const v = rng.pick(vehicles)
    const roll = rng.next()
    const severity: IncidentSeverity =
      roll < 0.55 ? "minor" : roll < 0.85 ? "medium" : "major"
    const place = rng.pick(PLACES)
    const location = rng.jitter(place.position, 0.03)

    let repairCostEtb: number
    let insuranceClaimEtb: number
    let casualties: number
    if (severity === "minor") {
      repairCostEtb = rng.int(8000, 40000)
      insuranceClaimEtb = rng.bool(0.5) ? rng.int(2000, 20000) : 0
      casualties = 0
    } else if (severity === "medium") {
      repairCostEtb = rng.int(40000, 150000)
      insuranceClaimEtb = rng.int(20000, 90000)
      casualties = rng.int(0, 2)
    } else {
      repairCostEtb = rng.int(150000, 600000)
      insuranceClaimEtb = rng.int(80000, 320000)
      casualties = rng.int(0, 5)
    }

    records.push({
      id: `acc-${pad(i + 1, 3)}`,
      vehicleId: v.id,
      vehiclePlate: v.plate,
      entityId: v.entityId,
      severity,
      rootCause: rng.pick(INCIDENT_ROOT_CAUSES),
      location,
      address: nearestPlaceName(location),
      occurredAt: ago(rng.float(2 * DAY, 360 * DAY), now),
      casualties,
      policeReportNo: `FP-${pad(rng.int(10000, 99999), 5)}`,
      repairCostEtb,
      insuranceClaimEtb,
      notes: "",
      createdAt: ago(rng.float(1 * DAY, 360 * DAY), now),
    })
  }

  records.sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt))
  records.forEach((r, i) => {
    r.id = `acc-${pad(i + 1, 3)}`
  })
  return records
}

// ---------------------------------------------------------------------------
// Access control (RBAC) — roles & web users (SRS Admin Panel)
// ---------------------------------------------------------------------------

function permsFor(
  modules: readonly PermissionModule[],
  actions: readonly PermissionAction[]
): Permission[] {
  const out: Permission[] = []
  for (const m of modules) for (const a of actions) out.push(`${m}:${a}`)
  return out
}

function buildRoles(rng: Rng, now: number): Role[] {
  const ALL = permsFor(PERMISSION_MODULES, PERMISSION_ACTIONS)
  const OPS = PERMISSION_MODULES.filter((m) => m !== "admin")
  const role = (
    i: number,
    name: string,
    type: RoleType,
    description: string,
    permissions: Permission[],
    systemFixed = false
  ): Role => ({
    id: `role-${pad(i, 2)}`,
    name,
    type,
    description,
    permissions,
    systemFixed,
    createdAt: ago(rng.float(120 * DAY, 360 * DAY), now),
  })

  return [
    role(
      1,
      "System Administrator",
      "admin",
      "Full platform access including user and role administration.",
      ALL,
      true
    ),
    role(
      2,
      "Fleet Administrator",
      "admin",
      "Manages every fleet operations module; no user administration.",
      [...permsFor(OPS, PERMISSION_ACTIONS), "admin:view"]
    ),
    role(
      3,
      "Fleet Operations Officer",
      "fms",
      "Day-to-day monitoring — view, create and edit operational records.",
      [
        ...permsFor(
          ["fleet", "events", "geozones", "routes", "providers"],
          ["view", "create", "edit"]
        ),
        ...permsFor(["reports", "incidents"], ["view"]),
      ]
    ),
    role(
      4,
      "Compliance Officer",
      "fms",
      "Owns the events, incidents and reporting workflows.",
      [
        ...permsFor(OPS, ["view"]),
        ...permsFor(["events", "incidents", "reports"], [
          "create",
          "edit",
          "manage",
        ]),
      ]
    ),
    role(
      5,
      "Read-only Viewer",
      "fms",
      "Read-only visibility across all operational modules.",
      permsFor(OPS, ["view"])
    ),
  ]
}

interface StaffName {
  first: string
  last: string
}

const STAFF_NAMES: StaffName[] = [
  { first: "Tewodros", last: "Gizaw" },
  { first: "Marta", last: "Wolde" },
  { first: "Daniel", last: "Tefera" },
  { first: "Lensa", last: "Dinka" },
  { first: "Yohannes", last: "Bekele" },
  { first: "Saron", last: "Habte" },
  { first: "Abel", last: "Mamo" },
  { first: "Kalkidan", last: "Belay" },
  { first: "Nardos", last: "Getnet" },
  { first: "Surafel", last: "Admasu" },
  { first: "Hewan", last: "Solomon" },
  { first: "Yared", last: "Tilahun" },
]

function buildWebUsers(
  rng: Rng,
  entities: Entity[],
  now: number
): WebUser[] {
  // Distribution across the five seeded roles.
  const rolePlan = [
    "role-01",
    "role-02",
    "role-02",
    "role-03",
    "role-03",
    "role-03",
    "role-03",
    "role-04",
    "role-04",
    "role-05",
    "role-05",
    "role-05",
  ]

  return rolePlan.map((roleId, i) => {
    const nm = STAFF_NAMES[i % STAFF_NAMES.length]!
    const entity = rng.pick(entities)
    const domain = entity.email.split("@")[1] ?? "motl.gov.et"
    const status: WebUserStatus =
      i === 0 || rng.next() < 0.78
        ? "active"
        : rng.bool(0.5)
          ? "inactive"
          : "locked"
    const lastLoginAt =
      status === "active"
        ? ago(rng.float(5 * MIN, 6 * DAY), now)
        : status === "inactive"
          ? ago(rng.float(30 * DAY, 200 * DAY), now)
          : null
    return {
      id: `usr-${pad(i + 1, 2)}`,
      name: `${nm.first} ${nm.last}`,
      email: `${nm.first.toLowerCase()}.${nm.last.toLowerCase()}@${domain}`,
      roleId,
      status,
      phone: `+2519${pad(rng.int(0, 99999999), 8)}`,
      entityId: roleId === "role-01" ? null : entity.id,
      lastLoginAt,
      createdAt: ago(rng.float(60 * DAY, 360 * DAY), now),
    }
  })
}

// ---------------------------------------------------------------------------
// Assemble the DB
// ---------------------------------------------------------------------------

export function createSeedDB(): DB {
  const rng = makeRng(SEED)
  const now = Date.now()

  const entities = buildEntities()
  const routes = buildRoutes(rng, now)
  const { geozones, groups, byName } = buildGeozones(rng, routes, now)
  const eventRules = buildEventRules(byName, routes)
  const { vehicles } = buildVehicles(rng, routes, geozones, now)

  // Showcase a vehicle-scoped trigger: a stricter speed limit + email alert for
  // two flagged vehicles, on top of the fleet-wide rule.
  if (vehicles.length >= 2) {
    eventRules.push({
      id: "rule-scoped-01",
      name: "Priority vehicles — strict speed",
      geozoneId: null,
      routeId: null,
      type: "global_speeding",
      speedLimitKmh: 85,
      thresholdMinutes: null,
      deviationMeters: null,
      vehicleIds: vehicles.slice(0, 2).map((v) => v.id),
      severity: "critical",
      notify: {
        email: true,
        emailTo: "control.room@motl.gov.et",
        sms: false,
        smsTo: "",
      },
      active: true,
    })
  }
  const trips = buildTrips(rng, vehicles, routes, now)
  const events = buildEvents(rng, vehicles, geozones, now)
  const providerTelemetry = buildProviderTelemetry(rng, entities, vehicles)
  const accidents = buildAccidents(rng, vehicles, now)
  const roles = buildRoles(rng, now)
  const webUsers = buildWebUsers(rng, entities, now)

  return {
    entities,
    vehicles,
    geozones,
    geozoneGroups: groups,
    eventRules,
    events,
    providerTelemetry,
    routes,
    trips,
    accidents,
    roles,
    webUsers,
  }
}
