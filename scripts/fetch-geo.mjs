// Dev-only tool (NOT imported by the app). Fetches real road geometry from the
// public OSRM server and real facility footprints from OpenStreetMap (Overpass),
// simplifies them, and writes src/data/geo-real.ts as static coordinates so the
// prototype stays fully offline and deterministic at runtime.
//
//   node scripts/fetch-geo.mjs
//
// Re-run to refresh the baked data if OSM changes. Requires Node 18+ (global fetch).

import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "..", "src", "data", "geo-real.ts")

// --- Reference data (kept in sync with src/data/geo.ts) ---------------------

const PLACES = {
  "Addis Ababa": { lat: 9.0301, lng: 38.7468 },
  Kality: { lat: 8.91, lng: 38.76 },
  Modjo: { lat: 8.5839, lng: 39.1209 },
  Adama: { lat: 8.54, lng: 39.2675 },
  Awash: { lat: 8.9911, lng: 40.1675 },
  Gewane: { lat: 10.167, lng: 40.646 },
  Mille: { lat: 11.42, lng: 40.767 },
  Galafi: { lat: 11.706, lng: 41.837 },
  Dikhil: { lat: 11.105, lng: 42.37 },
  "Djibouti City": { lat: 11.572, lng: 43.145 },
  Mieso: { lat: 9.233, lng: 40.75 },
  "Dire Dawa": { lat: 9.5931, lng: 41.8661 },
  Dewele: { lat: 10.99, lng: 42.638 },
  Hawassa: { lat: 7.062, lng: 38.476 },
  "Bahir Dar": { lat: 11.594, lng: 37.39 },
  "Debre Markos": { lat: 10.334, lng: 37.724 },
  Dessie: { lat: 11.13, lng: 39.633 },
  Kombolcha: { lat: 11.085, lng: 39.744 },
  Semera: { lat: 11.795, lng: 41.008 },
  Bishoftu: { lat: 8.752, lng: 38.978 },
}

const ROUTE_BLUEPRINTS = [
  {
    name: "Addis–Djibouti Corridor (North)",
    waypoints: [
      "Addis Ababa",
      "Adama",
      "Awash",
      "Gewane",
      "Mille",
      "Galafi",
      "Dikhil",
      "Djibouti City",
    ],
  },
  {
    name: "Addis–Djibouti via Dire Dawa",
    waypoints: [
      "Addis Ababa",
      "Adama",
      "Awash",
      "Mieso",
      "Dire Dawa",
      "Dewele",
      "Djibouti City",
    ],
  },
  {
    name: "Addis–Adama Expressway",
    waypoints: ["Addis Ababa", "Bishoftu", "Modjo", "Adama"],
  },
  {
    name: "Modjo–Hawassa Freight Route",
    waypoints: ["Modjo", "Hawassa"],
  },
  {
    name: "Addis–Bahir Dar",
    waypoints: ["Addis Ababa", "Debre Markos", "Bahir Dar"],
  },
  {
    name: "Addis–Kombolcha Industrial",
    waypoints: ["Addis Ababa", "Dessie", "Kombolcha"],
  },
]

// --- Geometry helpers -------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const round5 = (n) => Math.round(n * 1e5) / 1e5

// Perpendicular distance (in degrees, lng scaled by cos(lat)) of p from line a–b.
function perpDist(p, a, b) {
  const k = Math.cos((a.lat * Math.PI) / 180)
  const px = p.lng * k,
    py = p.lat
  const ax = a.lng * k,
    ay = a.lat
  const bx = b.lng * k,
    by = b.lat
  const dx = bx - ax,
    dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - ax, py - ay)
  const t = ((px - ax) * dx + (py - ay) * dy) / len2
  const cx = ax + t * dx,
    cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

// Ramer–Douglas–Peucker simplification, preserving endpoints.
function rdp(points, eps) {
  if (points.length < 3) return points.slice()
  let maxD = 0,
    idx = 0
  const a = points[0],
    b = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], a, b)
    if (d > maxD) {
      maxD = d
      idx = i
    }
  }
  if (maxD > eps) {
    const left = rdp(points.slice(0, idx + 1), eps)
    const right = rdp(points.slice(idx), eps)
    return left.slice(0, -1).concat(right)
  }
  return [a, b]
}

// Simplify to at most `maxPts` by ramping epsilon up until it fits.
function simplifyTo(points, startEps, maxPts) {
  let eps = startEps
  let out = rdp(points, eps)
  let guard = 0
  while (out.length > maxPts && guard++ < 30) {
    eps *= 1.5
    out = rdp(points, eps)
  }
  return out
}

// Andrew's monotone-chain convex hull (x = lng, y = lat).
function convexHull(pts) {
  const p = [...pts].sort((a, b) => a.lng - b.lng || a.lat - b.lat)
  if (p.length < 3) return p
  const cross = (o, a, b) =>
    (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng)
  const lower = []
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0)
      lower.pop()
    lower.push(q)
  }
  const upper = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0)
      upper.pop()
    upper.push(q)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

// Shoelace area (relative; lng scaled by cos(lat)). Used to pick the biggest polygon.
function area(poly) {
  const k = Math.cos((poly[0].lat * Math.PI) / 180)
  let s = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    s += poly[j].lng * k * poly[i].lat - poly[i].lng * k * poly[j].lat
  }
  return Math.abs(s) / 2
}

function densifyStraight(a, b, n = 10) {
  const out = []
  for (let s = 1; s < n; s++) {
    const t = s / n
    out.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t })
  }
  return out
}

// --- OSRM (routes) ----------------------------------------------------------

const OSRM = "https://router.project-osrm.org/route/v1/driving/"

async function osrmLeg(a, b) {
  const url = `${OSRM}${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== "Ok" || !data.routes?.length) throw new Error(data.code || "no route")
  return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
}

async function fetchRoute(bp) {
  const coords = bp.waypoints.map((n) => PLACES[n])
  // Try one request through all waypoints first.
  try {
    const joined = coords.map((c) => `${c.lng},${c.lat}`).join(";")
    const res = await fetch(`${OSRM}${joined}?overview=full&geometries=geojson`)
    const data = await res.json()
    if (data.code === "Ok" && data.routes?.length) {
      return data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
    }
    throw new Error(data.code || "multi failed")
  } catch (e) {
    // Per-leg fallback; straight-line any leg OSRM can't route.
    console.warn(`  multi-stop failed (${e.message}); stitching legs`)
    const path = [coords[0]]
    for (let i = 1; i < coords.length; i++) {
      try {
        const leg = await osrmLeg(coords[i - 1], coords[i])
        path.push(...leg.slice(1))
      } catch (le) {
        console.warn(`    leg ${bp.waypoints[i - 1]}→${bp.waypoints[i]} straight (${le.message})`)
        path.push(...densifyStraight(coords[i - 1], coords[i]), coords[i])
      }
      await sleep(400)
    }
    return path
  }
}

// --- Overpass (facility footprints) -----------------------------------------

// Overpass needs a meaningful User-Agent or it returns 406/429. Try a few
// mirrors with backoff so a single flaky endpoint doesn't fail the run.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]
const UA = "ifms-prototype-geo-fetch/1.0 (fleet demo; contact: dev@example.com)"

async function overpass(query) {
  let lastErr
  for (const ep of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(ep, {
          method: "POST",
          body: "data=" + encodeURIComponent(query),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": UA,
          },
        })
        const txt = await res.text()
        if (!txt.trim().startsWith("{")) throw new Error(`${res.status} non-JSON`)
        const data = JSON.parse(txt)
        return (data.elements || []).filter((e) => e.geometry?.length >= 3)
      } catch (e) {
        lastErr = e
        await sleep(1500 * (attempt + 1))
      }
    }
  }
  throw lastErr ?? new Error("overpass failed")
}

const wayToPoly = (el) => el.geometry.map((g) => ({ lat: g.lat, lng: g.lon }))

// Largest polygon in a bbox matching any of the given tag filters.
async function biggestFootprint(bbox, filters) {
  const [s, w, n, e] = bbox
  const body = filters.map((f) => `  way${f}(${s},${w},${n},${e});`).join("\n")
  const q = `[out:json][timeout:40];\n(\n${body}\n);\nout geom;`
  const els = await overpass(q)
  if (!els.length) return null
  let best = null,
    bestA = 0
  for (const el of els) {
    const poly = wayToPoly(el)
    const a = area(poly)
    if (a > bestA) {
      bestA = a
      best = poly
    }
  }
  return best
}

// Facility footprint strategies. Each returns a closed-ish ring of {lat,lng}.
const FACILITIES = [
  {
    name: "Modjo Dry Port",
    async run() {
      const els = await overpass(`[out:json][timeout:40];way(224084343);out geom;`)
      return els.length ? wayToPoly(els[0]) : null
    },
  },
  {
    name: "Port of Djibouti Terminal",
    run: () =>
      biggestFootprint([11.555, 42.99, 11.63, 43.17], [
        '["industrial"="port"]',
        '["landuse"="industrial"]',
        '["man_made"="works"]',
      ]),
  },
  {
    name: "Hawassa Industrial Park",
    run: () =>
      biggestFootprint([6.99, 38.41, 7.12, 38.55], [
        '["landuse"="industrial"]',
        '["industrial"="park"]',
      ]),
  },
  {
    name: "Dire Dawa Freight Depot",
    run: () =>
      biggestFootprint([9.54, 41.79, 9.66, 41.93], [
        '["industrial"="port"]',
        '["landuse"="industrial"]',
        '["landuse"="railway"]',
      ]),
  },
  {
    name: "Kality Customs Terminal",
    run: () =>
      biggestFootprint([8.86, 38.71, 8.95, 38.81], [
        '["industrial"="port"]',
        '["landuse"="industrial"]',
      ]),
  },
  {
    name: "Semera Logistics Hub",
    run: () =>
      biggestFootprint([11.74, 40.95, 11.85, 41.07], [
        '["landuse"="industrial"]',
        '["industrial"="port"]',
      ]),
  },
  {
    name: "Addis Ababa Ring Road Zone",
    async run() {
      // Convex hull of the ring-road ways ≈ the area the ring encloses.
      const els = await overpass(
        `[out:json][timeout:50];way["highway"]["name"~"Ring",i](8.9,38.66,9.08,38.9);out geom;`
      )
      if (!els.length) return null
      const pts = els.flatMap(wayToPoly)
      return convexHull(pts)
    },
  },
]

// --- Run --------------------------------------------------------------------

function fmtPoly(poly) {
  return (
    "[\n" +
    poly
      .map((p) => `    { lat: ${round5(p.lat)}, lng: ${round5(p.lng)} },`)
      .join("\n") +
    "\n  ]"
  )
}

async function main() {
  const roads = {}
  console.log("Fetching road geometry (OSRM)…")
  for (const bp of ROUTE_BLUEPRINTS) {
    const raw = await fetchRoute(bp)
    const simplified = simplifyTo(raw, 0.00035, 280)
    roads[bp.name] = simplified
    console.log(`  ${bp.name}: ${raw.length} → ${simplified.length} pts`)
    await sleep(500)
  }

  const footprints = {}
  console.log("Fetching facility footprints (Overpass)…")
  for (const f of FACILITIES) {
    try {
      const poly = await f.run()
      if (poly && poly.length >= 3) {
        const simplified = simplifyTo(poly, 0.00012, 44)
        footprints[f.name] = simplified
        console.log(`  ${f.name}: ${poly.length} → ${simplified.length} pts`)
      } else {
        console.log(`  ${f.name}: no OSM data → seed will generate a compound`)
      }
    } catch (e) {
      console.log(`  ${f.name}: FAILED (${e.message}) → seed will generate a compound`)
    }
    await sleep(1200)
  }

  const body =
    `// AUTO-GENERATED by scripts/fetch-geo.mjs — do not edit by hand.\n` +
    `// Real road geometry (OSRM / OpenStreetMap) and facility footprints\n` +
    `// (OSM Overpass) baked as static coordinates so the prototype renders\n` +
    `// real roads and real outlines while staying fully offline & deterministic.\n` +
    `// Re-run \`node scripts/fetch-geo.mjs\` to refresh.\n\n` +
    `import type { LatLng } from "@/data/types"\n\n` +
    `/** Real driving geometry per route name (OSRM). */\n` +
    `export const ROAD_GEOMETRY: Record<string, LatLng[]> = {\n` +
    Object.entries(roads)
      .map(([k, v]) => `  ${JSON.stringify(k)}: ${fmtPoly(v)},`)
      .join("\n") +
    `\n}\n\n` +
    `/** Real facility footprints per geozone name (OSM Overpass). Zones absent\n` +
    ` *  here fall back to a generated roadside compound in the seed. */\n` +
    `export const FACILITY_FOOTPRINTS: Record<string, LatLng[]> = {\n` +
    Object.entries(footprints)
      .map(([k, v]) => `  ${JSON.stringify(k)}: ${fmtPoly(v)},`)
      .join("\n") +
    `\n}\n`

  writeFileSync(OUT, body)
  console.log(`\nWrote ${OUT}`)
  console.log(
    `Routes: ${Object.keys(roads).length}, Footprints: ${Object.keys(footprints).length}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
