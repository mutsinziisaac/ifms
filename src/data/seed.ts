// Seeded, stable, realistic Ethiopian fleet-monitoring data for the IFMS
// prototype. A fixed-seed PRNG keeps the data identical across reloads while
// timestamps are anchored to the live clock so "x min ago" reads fresh.

import {
  centroidOf,
  interpolateAlongPath,
  isInsideGeozone,
  pathLengthKm,
} from "@/lib/maps"
import {
  ETHIOPIA_REGIONS,
  GPS_PROVIDERS,
  VEHICLE_TYPES,
  type Alert,
  type AlertRule,
  type AlertSeverity,
  type AlertType,
  type DB,
  type Driver,
  type DriverStatus,
  type Entity,
  type EthiopiaRegion,
  type Geozone,
  type GeozoneGroup,
  type LatLng,
  type LicenseCategory,
  type MaintenanceTask,
  type MaintenanceVehicleState,
  type RouteDef,
  type Trip,
  type Vehicle,
  type VehicleDriverAssignment,
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

// Build a small polygon (4–6 vertices) around a center, a few km across.
function polygonAround(
  center: LatLng,
  radiusDeg: number,
  vertices: number,
  rng: Rng
): LatLng[] {
  const out: LatLng[] = []
  const startAngle = rng.float(0, Math.PI * 2)
  for (let i = 0; i < vertices; i++) {
    const angle = startAngle + (i / vertices) * Math.PI * 2
    // Latitude shrinks longitude span; keep it visually round.
    const r = radiusDeg * rng.float(0.78, 1.18)
    out.push({
      lat: center.lat + Math.sin(angle) * r,
      lng:
        center.lng +
        (Math.cos(angle) * r) / Math.cos((center.lat * Math.PI) / 180),
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

interface EntitySeed {
  name: string
  shortName: string
  domain: string
  address: string
  phone: string
  region: EthiopiaRegion
}

const ENTITY_SEEDS: EntitySeed[] = [
  {
    name: "Ethiopian Shipping & Logistics Services Enterprise",
    shortName: "ESLSE",
    domain: "eslse",
    address: "Algeria Street, Kirkos, Addis Ababa",
    phone: "+251 11 551 2900",
    region: "Addis Ababa",
  },
  {
    name: "Comet Transport S.C.",
    shortName: "Comet",
    domain: "comet",
    address: "Debre Zeit Road, Akaki Kaliti, Addis Ababa",
    phone: "+251 11 439 1140",
    region: "Addis Ababa",
  },
  {
    name: "Trans Ethiopia PLC",
    shortName: "TransEth",
    domain: "transethiopia",
    address: "Industry Street, Mekelle Road, Adama",
    phone: "+251 22 111 8820",
    region: "Oromia",
  },
  {
    name: "Abay Logistics PLC",
    shortName: "Abay",
    domain: "abaylogistics",
    address: "Tana Avenue, Bahir Dar",
    phone: "+251 58 220 4470",
    region: "Amhara",
  },
  {
    name: "Tikur Abay Transport S.C.",
    shortName: "Tikur Abay",
    domain: "tikurabay",
    address: "Gish Abay Street, Bahir Dar",
    phone: "+251 58 226 1190",
    region: "Amhara",
  },
  {
    name: "Shebelle Transport S.C.",
    shortName: "Shebelle",
    domain: "shebelle",
    address: "Jigjiga Road, Dire Dawa",
    phone: "+251 25 111 3360",
    region: "Dire Dawa",
  },
  {
    name: "Selam Bus Line S.C.",
    shortName: "Selam Bus",
    domain: "selambus",
    address: "Meskel Square, Kirkos, Addis Ababa",
    phone: "+251 11 554 8800",
    region: "Addis Ababa",
  },
  {
    name: "Awash Freight Carriers PLC",
    shortName: "Awash Freight",
    domain: "awashfreight",
    address: "Corridor Road, Awash Town, Afar",
    phone: "+251 22 224 0150",
    region: "Afar",
  },
  {
    name: "Horizon Oil Transporters PLC",
    shortName: "Horizon Oil",
    domain: "horizonoil",
    address: "Kality Fuel Depot Road, Akaki Kaliti, Addis Ababa",
    phone: "+251 11 471 6620",
    region: "Addis Ababa",
  },
]

function buildEntities(): Entity[] {
  return ENTITY_SEEDS.map((e, i) => ({
    id: `ent-${pad(i + 1, 2)}`,
    name: e.name,
    shortName: e.shortName,
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
    const path = densifyPath(places.map((p) => p.position))
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

interface CircleSeed {
  name: string
  place: string
  radiusM: number
  note: string
}

interface PolygonSeed {
  name: string
  place: string
  spanDeg: number
  vertices: number
  note: string
}

const CIRCLE_SEEDS: CircleSeed[] = [
  {
    name: "Modjo Dry Port",
    place: "Modjo",
    radiusM: 2500,
    note: "Primary inland container depot for the Djibouti corridor.",
  },
  {
    name: "Adama Weighbridge",
    place: "Adama",
    radiusM: 1200,
    note: "Mandatory axle-load weighing for outbound freight.",
  },
  {
    name: "Awash Checkpoint",
    place: "Awash",
    radiusM: 1500,
    note: "Federal police checkpoint and corridor rest stop.",
  },
  {
    name: "Mille Checkpoint",
    place: "Mille",
    radiusM: 1500,
    note: "Customs control point on the Afar corridor.",
  },
  {
    name: "Dewele Border Post",
    place: "Dewele",
    radiusM: 2000,
    note: "Ethiopia–Djibouti land border crossing near the railway.",
  },
  {
    name: "Kality Customs Terminal",
    place: "Kality",
    radiusM: 1800,
    note: "Addis Ababa customs clearance and bonded warehouse area.",
  },
  {
    name: "Hawassa Industrial Park",
    place: "Hawassa",
    radiusM: 2200,
    note: "Export-oriented manufacturing park served by corridor freight.",
  },
]

const POLYGON_SEEDS: PolygonSeed[] = [
  {
    name: "Galafi Border Crossing",
    place: "Galafi",
    spanDeg: 0.03,
    vertices: 5,
    note: "Main road border crossing into Djibouti.",
  },
  {
    name: "Dire Dawa Freight Depot",
    place: "Dire Dawa",
    spanDeg: 0.025,
    vertices: 5,
    note: "Rail-linked freight consolidation depot.",
  },
  {
    name: "Port of Djibouti Terminal",
    place: "Djibouti City",
    spanDeg: 0.035,
    vertices: 6,
    note: "Doraleh multipurpose port terminal — corridor destination.",
  },
  {
    name: "Addis Ababa Ring Road Zone",
    place: "Addis Ababa",
    spanDeg: 0.075,
    vertices: 6,
    note: "City restricted-access zone bounded by the ring road.",
  },
  {
    name: "Semera Logistics Hub",
    place: "Semera",
    spanDeg: 0.028,
    vertices: 5,
    note: "Afar regional logistics and staging hub.",
  },
]

interface BuiltGeozones {
  geozones: Geozone[]
  groups: GeozoneGroup[]
  byName: Map<string, Geozone>
}

function buildGeozones(rng: Rng, now: number): BuiltGeozones {
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

  for (const c of CIRCLE_SEEDS) {
    n++
    const center = placeByName(c.place).position
    geozones.push({
      id: `geo-${pad(n, 2)}`,
      name: c.name,
      shape: "circle",
      center,
      radiusM: c.radiusM,
      path: null,
      address: nearestPlaceName(center),
      groupId: groupOf[c.name] ?? null,
      visible: true,
      isPOI: true,
      note: c.note,
      createdAt: ago(rng.float(60 * DAY, 360 * DAY), now),
    })
  }

  for (const p of POLYGON_SEEDS) {
    n++
    const anchor = placeByName(p.place).position
    const path = polygonAround(anchor, p.spanDeg, p.vertices, rng)
    const center = centroidOf(path)
    geozones.push({
      id: `geo-${pad(n, 2)}`,
      name: p.name,
      shape: "polygon",
      center,
      radiusM: null,
      path,
      address: nearestPlaceName(center),
      groupId: groupOf[p.name] ?? null,
      visible: true,
      isPOI: true,
      note: p.note,
      createdAt: ago(rng.float(60 * DAY, 360 * DAY), now),
    })
  }

  const byName = new Map(geozones.map((g) => [g.name, g]))
  return { geozones, groups, byName }
}

// ---------------------------------------------------------------------------
// Alert rules
// ---------------------------------------------------------------------------

function buildAlertRules(byName: Map<string, Geozone>): AlertRule[] {
  const rules: AlertRule[] = []
  let n = 0
  const add = (
    zoneName: string,
    type: AlertRule["type"],
    speedLimitKmh: number | null,
    active: boolean
  ) => {
    const zone = byName.get(zoneName)
    if (!zone) return
    n++
    rules.push({
      id: `rule-${pad(n, 2)}`,
      geozoneId: zone.id,
      type,
      speedLimitKmh,
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
    add(z, "entry", null, true)
    add(z, "exit", null, true)
  }

  // Speeding rules at the three checkpoint zones.
  for (const z of [
    "Awash Checkpoint",
    "Mille Checkpoint",
    "Adama Weighbridge",
  ]) {
    add(z, "speeding", 80, true)
  }

  // Deactivated entry rule for Hawassa Industrial Park (demonstrates toggle).
  add("Hawassa Industrial Park", "entry", null, false)

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

// Type distribution: 18 truck, 8 trailer, 7 tanker, 6 container, 5 bus, 4 pickup.
function buildTypePool(): VehicleType[] {
  const counts: Record<VehicleType, number> = {
    truck: 18,
    trailer: 8,
    tanker: 7,
    container: 6,
    bus: 5,
    pickup: 4,
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
    return {
      id: `veh-${pad(idx, 3)}`,
      plate: plate(rng),
      type,
      description: modelFor(type, rng),
      entityId: `ent-${pad(rng.int(1, ENTITY_SEEDS.length), 2)}`,
      region: rng.pick(ETHIOPIA_REGIONS),
      gpsProvider: rng.pick(GPS_PROVIDERS),
      driverId: null,
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
      rng.jitter(modjoZone.center, 0.005),
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
      rng.jitter(kalityZone.center, 0.004),
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
// Drivers
// ---------------------------------------------------------------------------

interface NameSeed {
  first: string
  last: string
  female: boolean
}

const DRIVER_NAMES: NameSeed[] = [
  { first: "Abebe", last: "Bekele", female: false },
  { first: "Tigist", last: "Alemu", female: true },
  { first: "Dawit", last: "Haile", female: false },
  { first: "Selamawit", last: "Tesfaye", female: true },
  { first: "Yonas", last: "Gebre", female: false },
  { first: "Hanna", last: "Mekonnen", female: true },
  { first: "Mulugeta", last: "Assefa", female: false },
  { first: "Sara", last: "Tadesse", female: true },
  { first: "Getachew", last: "Worku", female: false },
  { first: "Meron", last: "Abate", female: true },
  { first: "Bereket", last: "Fikre", female: false },
  { first: "Almaz", last: "Negash", female: true },
  { first: "Kebede", last: "Lemma", female: false },
  { first: "Rahel", last: "Girma", female: true },
  { first: "Tesfaye", last: "Demissie", female: false },
  { first: "Bethlehem", last: "Hailu", female: true },
  { first: "Solomon", last: "Tariku", female: false },
  { first: "Martha", last: "Yohannes", female: true },
  { first: "Eyob", last: "Shiferaw", female: false },
  { first: "Helen", last: "Desta", female: true },
  { first: "Biniam", last: "Asrat", female: false },
  { first: "Genet", last: "Mengistu", female: true },
  { first: "Henok", last: "Abera", female: false },
  { first: "Liya", last: "Kassahun", female: true },
  { first: "Samuel", last: "Bogale", female: false },
  { first: "Ruth", last: "Endale", female: true },
  { first: "Fitsum", last: "Zeleke", female: false },
  { first: "Hiwot", last: "Berhanu", female: true },
  { first: "Nahom", last: "Tsegaye", female: false },
  { first: "Mahlet", last: "Ayele", female: true },
  { first: "Robel", last: "Mekuria", female: false },
  { first: "Senait", last: "Gebremariam", female: true },
  { first: "Kaleb", last: "Wondimu", female: false },
  { first: "Feven", last: "Asfaw", female: true },
  { first: "Mikias", last: "Teshome", female: false },
  { first: "Aster", last: "Kifle", female: true },
]

// Driver status distribution: 30 active, 3 on_leave, 2 suspended, 1 inactive.
function driverStatusPool(): DriverStatus[] {
  const pool: DriverStatus[] = []
  for (let i = 0; i < 30; i++) pool.push("active")
  for (let i = 0; i < 3; i++) pool.push("on_leave")
  for (let i = 0; i < 2; i++) pool.push("suspended")
  pool.push("inactive")
  return pool
}

interface BuiltDrivers {
  drivers: Driver[]
}

function buildDrivers(
  rng: Rng,
  vehicles: Vehicle[],
  entityDomains: string[],
  now: number
): BuiltDrivers {
  const statusPool = driverStatusPool() // 36 entries

  const drivers: Driver[] = DRIVER_NAMES.map((nm, i) => {
    const status = statusPool[i]!
    const entityIdx = rng.int(0, entityDomains.length - 1)
    const domain = entityDomains[entityIdx]!
    // Safety score and inverse-correlated incident counts.
    const safetyScore = rng.int(55, 98)
    const risk = (98 - safetyScore) / 43 // 0 (safe) .. 1 (risky)
    const harshBrakingCount = Math.round(risk * rng.float(2, 14))
    const harshAccelCount = Math.round(risk * rng.float(2, 12))
    const speedingCount = Math.round(risk * rng.float(1, 10))
    // License expiry between -3 and +30 months; first two are expired.
    let expiryMs: number
    if (i < 2) {
      expiryMs = now - rng.float(10 * DAY, 80 * DAY)
    } else {
      expiryMs = now + rng.float(-30 * DAY, 30 * 30 * DAY)
    }
    return {
      id: `drv-${pad(i + 1, 3)}`,
      firstName: nm.first,
      lastName: nm.last,
      licenseNo: `ETH-DL-1${pad(rng.int(0, 99999), 5)}`,
      licenseCategory: "C" as LicenseCategory, // refined below once vehicle known
      licenseExpiry: new Date(expiryMs).toISOString(),
      phone: `+2519${pad(rng.int(0, 99999999), 8)}`,
      email: `${nm.first.toLowerCase()}.${nm.last.toLowerCase()}@${domain}.et`,
      entityId: `ent-${pad(entityIdx + 1, 2)}`,
      status,
      assignedVehicleId: null,
      hireDate: ago(rng.float(1 * 365 * DAY, 15 * 365 * DAY), now),
      emergencyContactName: rng.pick(DRIVER_NAMES.filter((d) => d !== nm))
        .first,
      emergencyContactPhone: `+2519${pad(rng.int(0, 99999999), 8)}`,
      safetyScore,
      harshBrakingCount,
      harshAccelCount,
      speedingCount,
    }
  })

  // Assign ~27 drivers to vehicles (eligible = active drivers first), keeping
  // back-references consistent and never double-assigning.
  const assignableDrivers = drivers.filter((d) => d.status === "active")
  // Prefer assigning to a varied set of vehicles; keep some unassigned.
  const shuffledVehicles = [...vehicles]
  // Deterministic Fisher–Yates.
  for (let i = shuffledVehicles.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    const tmp = shuffledVehicles[i]!
    shuffledVehicles[i] = shuffledVehicles[j]!
    shuffledVehicles[j] = tmp
  }

  const assignCount = Math.min(
    27,
    assignableDrivers.length,
    shuffledVehicles.length
  )
  for (let k = 0; k < assignCount; k++) {
    const driver = assignableDrivers[k]!
    const vehicle = shuffledVehicles[k]!
    driver.assignedVehicleId = vehicle.id
    vehicle.driverId = driver.id
    // License category weighted by vehicle type.
    if (vehicle.type === "bus") {
      driver.licenseCategory = rng.bool(0.6) ? "Public II" : "D"
    } else if (vehicle.type === "pickup") {
      driver.licenseCategory = rng.bool(0.5) ? "B" : "C1"
    } else {
      driver.licenseCategory = rng.bool(0.6) ? "E" : "C"
    }
  }

  // Unassigned drivers still need a sensible category.
  for (const d of drivers) {
    if (d.assignedVehicleId === null) {
      d.licenseCategory = rng.pick([
        "C",
        "E",
        "C1",
        "D",
        "Public II",
      ] as LicenseCategory[])
    }
  }

  return { drivers }
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
// Driver assignment history
// ---------------------------------------------------------------------------

function buildAssignments(
  rng: Rng,
  vehicles: Vehicle[],
  drivers: Driver[],
  now: number
): VehicleDriverAssignment[] {
  const assignments: VehicleDriverAssignment[] = []
  let n = 0

  // Group drivers by entity so prior drivers come from the same company.
  const driversByEntity = new Map<string, Driver[]>()
  for (const d of drivers) {
    const list = driversByEntity.get(d.entityId) ?? []
    list.push(d)
    driversByEntity.set(d.entityId, list)
  }

  for (const v of vehicles) {
    if (v.driverId === null) continue

    // Open (current) assignment — started a few hours to ~8 days ago.
    const openStartMs = now - rng.float(3 * HOUR, 8 * DAY)
    n++
    assignments.push({
      id: `asn-${pad(n, 3)}`,
      vehicleId: v.id,
      driverId: v.driverId,
      startAt: new Date(openStartMs).toISOString(),
      endAt: null,
    })

    // 1–3 prior assignments using other drivers from the same entity. The
    // earliest segment is stretched back ≥40 days so the seeded trips (last
    // 30 days) reliably fall inside a driver segment.
    const pool = (driversByEntity.get(v.entityId) ?? drivers).filter(
      (d) => d.id !== v.driverId
    )
    const priorCount = pool.length === 0 ? 0 : rng.int(1, 3)
    let segEndMs = openStartMs
    for (let p = 0; p < priorCount; p++) {
      const driver = rng.pick(pool)
      const isLast = p === priorCount - 1
      let segStartMs = segEndMs - rng.float(4 * DAY, 16 * DAY)
      if (isLast) segStartMs = Math.min(segStartMs, now - 40 * DAY)
      n++
      assignments.push({
        id: `asn-${pad(n, 3)}`,
        vehicleId: v.id,
        driverId: driver.id,
        startAt: new Date(segStartMs).toISOString(),
        endAt: new Date(segEndMs).toISOString(),
      })
      segEndMs = segStartMs
    }
  }

  return assignments
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

function buildAlerts(
  rng: Rng,
  vehicles: Vehicle[],
  geozones: Geozone[],
  now: number
): Alert[] {
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
    type: AlertType
    severity: AlertSeverity
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
  const alerts: Alert[] = specs.map((spec, i) => {
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
    return {
      id: `alr-${pad(i + 1, 3)}`,
      type: spec.type,
      severity: spec.severity,
      vehicleId: v.id,
      vehiclePlate: v.plate,
      geozoneId: zone?.id ?? null,
      geozoneName: zone?.name ?? null,
      message,
      at: new Date(atMs).toISOString(),
      location,
      read: now - atMs > 12 * HOUR,
    }
  })

  // Newest first, then renumber ids so they read sequentially.
  alerts.sort((a, b) => +new Date(b.at) - +new Date(a.at))
  alerts.forEach((a, i) => {
    a.id = `alr-${pad(i + 1, 3)}`
  })
  return alerts
}

// ---------------------------------------------------------------------------
// Maintenance tasks
// ---------------------------------------------------------------------------

interface MaintTaskSeed {
  title: string
  description: string
  paramType: "mileage" | "date"
  intervalKm: number | null
  intervalDays: number | null
  alertBefore: number
}

const MAINT_SEEDS: MaintTaskSeed[] = [
  {
    title: "Engine oil & filter change",
    description:
      "Routine engine oil and oil-filter replacement to keep the powertrain healthy.",
    paramType: "mileage",
    intervalKm: 10000,
    intervalDays: null,
    alertBefore: 1000,
  },
  {
    title: "Tire inspection & rotation",
    description:
      "Inspect tread depth and rotate tires to even out wear across all axles.",
    paramType: "mileage",
    intervalKm: 20000,
    intervalDays: null,
    alertBefore: 2000,
  },
  {
    title: "Brake system overhaul",
    description:
      "Full inspection and overhaul of pads, discs and the air-brake system.",
    paramType: "mileage",
    intervalKm: 40000,
    intervalDays: null,
    alertBefore: 4000,
  },
  {
    title: "Annual technical inspection (Bolo)",
    description: "Mandatory annual roadworthiness inspection and Bolo renewal.",
    paramType: "date",
    intervalKm: null,
    intervalDays: 365,
    alertBefore: 30,
  },
  {
    title: "Insurance renewal",
    description:
      "Renew the third-party and comprehensive motor insurance policy.",
    paramType: "date",
    intervalKm: null,
    intervalDays: 365,
    alertBefore: 21,
  },
  {
    title: "Quarterly preventive service",
    description:
      "Scheduled quarterly preventive maintenance covering fluids, filters and belts.",
    paramType: "date",
    intervalKm: null,
    intervalDays: 90,
    alertBefore: 10,
  },
]

// Build a per-task list of outcome buckets so every task shows a believable
// mix of ~65% ok / 20% waiting / 15% delay (with at least one of each once the
// task covers enough vehicles), then shuffle so they don't cluster.
type Bucket = "ok" | "waiting" | "delay"
function bucketQuota(n: number, rng: Rng): Bucket[] {
  const delay = Math.max(n >= 7 ? 1 : 0, Math.round(n * 0.15))
  let waiting = Math.max(n >= 5 ? 1 : 0, Math.round(n * 0.2))
  if (delay + waiting > n) {
    waiting = Math.max(0, n - delay)
  }
  const ok = n - delay - waiting
  const buckets: Bucket[] = [
    ...Array<Bucket>(ok).fill("ok"),
    ...Array<Bucket>(waiting).fill("waiting"),
    ...Array<Bucket>(delay).fill("delay"),
  ]
  for (let k = buckets.length - 1; k > 0; k--) {
    const j = rng.int(0, k)
    const tmp = buckets[k]!
    buckets[k] = buckets[j]!
    buckets[j] = tmp
  }
  return buckets
}

function buildMaintenance(
  rng: Rng,
  vehicles: Vehicle[],
  now: number
): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = MAINT_SEEDS.map((seed, i) => {
    const count = rng.int(8, 20)
    // Distinct vehicles for this task.
    const pool = [...vehicles]
    for (let k = pool.length - 1; k > 0; k--) {
      const j = rng.int(0, k)
      const tmp = pool[k]!
      pool[k] = pool[j]!
      pool[j] = tmp
    }
    const chosen = pool.slice(0, Math.min(count, pool.length))
    const buckets = bucketQuota(chosen.length, rng)

    const states: MaintenanceVehicleState[] = chosen.map((v, ci) => {
      const bucket = buckets[ci]!
      if (seed.paramType === "mileage") {
        const interval = seed.intervalKm ?? 10000
        // remaining = lastServiceKm + interval - odometer.
        // Choose remaining as a fraction of interval per bucket, then derive
        // lastServiceKm = odometer - interval + remaining.
        let remainingFrac: number
        if (bucket === "ok") remainingFrac = rng.float(0.25, 0.95)
        else if (bucket === "waiting") remainingFrac = rng.float(0.02, 0.18)
        else remainingFrac = rng.float(-0.45, -0.02)
        const remaining = remainingFrac * interval
        // lastServiceKm derived so remainingPct === remainingFrac. Floor at 0
        // for the rare low-odometer vehicle (only nudges it further into "ok").
        const lastServiceKm = Math.max(
          0,
          Math.round(v.odometerKm - interval + remaining)
        )
        return { vehicleId: v.id, lastServiceKm, lastServiceDate: null }
      }
      const interval = seed.intervalDays ?? 365
      // remaining(days) = lastServiceDate + interval - now.
      let remainingFrac: number
      if (bucket === "ok") remainingFrac = rng.float(0.25, 0.95)
      else if (bucket === "waiting") remainingFrac = rng.float(0.02, 0.18)
      else remainingFrac = rng.float(-0.45, -0.02)
      const remainingDays = remainingFrac * interval
      // lastServiceDate = now - (interval - remainingDays).
      const elapsedDays = interval - remainingDays
      const lastServiceMs = now - elapsedDays * DAY
      return {
        vehicleId: v.id,
        lastServiceKm: null,
        lastServiceDate: new Date(lastServiceMs).toISOString(),
      }
    })

    return {
      id: `mnt-${pad(i + 1, 2)}`,
      title: seed.title,
      description: seed.description,
      paramType: seed.paramType,
      intervalKm: seed.intervalKm,
      intervalDays: seed.intervalDays,
      repeat: true,
      confirmation: rng.bool(0.5) ? "automatic" : "manual",
      emailNotifications: rng.bool(0.6),
      alertBefore: seed.alertBefore,
      vehicles: states,
      createdAt: ago(rng.float(60 * DAY, 300 * DAY), now),
    }
  })
  return tasks
}

// ---------------------------------------------------------------------------
// Assemble the DB
// ---------------------------------------------------------------------------

export function createSeedDB(): DB {
  const rng = makeRng(SEED)
  const now = Date.now()

  const entities = buildEntities()
  const entityDomains = ENTITY_SEEDS.map((e) => e.domain)
  const routes = buildRoutes(rng, now)
  const { geozones, groups, byName } = buildGeozones(rng, now)
  const alertRules = buildAlertRules(byName)
  const { vehicles } = buildVehicles(rng, routes, geozones, now)
  const { drivers } = buildDrivers(rng, vehicles, entityDomains, now)
  const trips = buildTrips(rng, vehicles, routes, now)
  const assignments = buildAssignments(rng, vehicles, drivers, now)
  const alerts = buildAlerts(rng, vehicles, geozones, now)
  const maintenanceTasks = buildMaintenance(rng, vehicles, now)

  return {
    entities,
    vehicles,
    drivers,
    geozones,
    geozoneGroups: groups,
    alertRules,
    alerts,
    routes,
    trips,
    assignments,
    maintenanceTasks,
  }
}
