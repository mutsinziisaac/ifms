// Geographic reference data for the Addis Ababa–Djibouti freight corridor and
// a few national routes. Coordinates are plausible real-world locations used
// to anchor the seeded vehicles, geozones, routes and trips.

import { haversineKm } from "@/lib/maps"
import type { LatLng } from "@/data/types"

// ---------------------------------------------------------------------------
// Named places
// ---------------------------------------------------------------------------

export interface Place {
  name: string
  position: LatLng
}

export const PLACES: Place[] = [
  { name: "Addis Ababa", position: { lat: 9.0301, lng: 38.7468 } },
  { name: "Kality", position: { lat: 8.91, lng: 38.76 } },
  { name: "Modjo", position: { lat: 8.5839, lng: 39.1209 } },
  { name: "Adama", position: { lat: 8.54, lng: 39.2675 } },
  { name: "Awash", position: { lat: 8.9911, lng: 40.1675 } },
  { name: "Gewane", position: { lat: 10.167, lng: 40.646 } },
  { name: "Mille", position: { lat: 11.42, lng: 40.767 } },
  { name: "Galafi", position: { lat: 11.706, lng: 41.837 } },
  { name: "Dikhil", position: { lat: 11.105, lng: 42.37 } },
  { name: "Djibouti City", position: { lat: 11.572, lng: 43.145 } },
  { name: "Mieso", position: { lat: 9.233, lng: 40.75 } },
  { name: "Dire Dawa", position: { lat: 9.5931, lng: 41.8661 } },
  { name: "Dewele", position: { lat: 10.99, lng: 42.638 } },
  { name: "Hawassa", position: { lat: 7.062, lng: 38.476 } },
  { name: "Bahir Dar", position: { lat: 11.594, lng: 37.39 } },
  { name: "Debre Markos", position: { lat: 10.334, lng: 37.724 } },
  { name: "Dessie", position: { lat: 11.13, lng: 39.633 } },
  { name: "Kombolcha", position: { lat: 11.085, lng: 39.744 } },
  { name: "Semera", position: { lat: 11.795, lng: 41.008 } },
  { name: "Bishoftu", position: { lat: 8.752, lng: 38.978 } },
]

export function placeByName(name: string): Place {
  const found = PLACES.find((p) => p.name === name)
  if (!found) {
    throw new Error(`Unknown place: ${name}`)
  }
  return found
}

/**
 * Nearest named place to a coordinate. Returns the place name when within
 * 12 km, otherwise "near <name>" so address strings stay believable.
 */
export function nearestPlaceName(p: LatLng): string {
  let best: Place | null = null
  let bestKm = Infinity
  for (const place of PLACES) {
    const km = haversineKm(p, place.position)
    if (km < bestKm) {
      bestKm = km
      best = place
    }
  }
  if (!best) return "Unknown"
  return bestKm <= 12 ? best.name : `near ${best.name}`
}

// ---------------------------------------------------------------------------
// Route blueprints — referenced by the seed to build RouteDef objects
// ---------------------------------------------------------------------------

export interface RouteBlueprint {
  name: string
  description: string
  waypointNames: string[]
}

export const ROUTE_BLUEPRINTS: RouteBlueprint[] = [
  {
    name: "Addis–Djibouti Corridor (North)",
    description:
      "Primary freight corridor carrying the bulk of Ethiopia's import/export traffic to the Port of Djibouti via the northern Afar route.",
    waypointNames: [
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
    description:
      "Alternate corridor to Djibouti running through Dire Dawa and the Dewele border post, paralleling the railway line.",
    waypointNames: [
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
    description:
      "Tolled expressway link between the capital and Adama, the main staging point for corridor freight.",
    waypointNames: ["Addis Ababa", "Bishoftu", "Modjo", "Adama"],
  },
  {
    name: "Modjo–Hawassa Freight Route",
    description:
      "Domestic distribution route from the Modjo dry port south to the Hawassa Industrial Park.",
    waypointNames: ["Modjo", "Hawassa"],
  },
  {
    name: "Addis–Bahir Dar",
    description:
      "North-western trunk route to Bahir Dar through Debre Markos serving the Amhara region.",
    waypointNames: ["Addis Ababa", "Debre Markos", "Bahir Dar"],
  },
  {
    name: "Addis–Kombolcha Industrial",
    description:
      "Industrial corridor to the Kombolcha hub via Dessie. Currently deactivated pending road rehabilitation.",
    waypointNames: ["Addis Ababa", "Dessie", "Kombolcha"],
  },
]

// ---------------------------------------------------------------------------
// Path densification — turn waypoint legs into road-like polylines
// ---------------------------------------------------------------------------

// Deterministic PRNG (mulberry32) so densified paths are stable across reloads.
function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const densifyRng = makeRng(0x1f2e3d4c)

/**
 * Insert interpolated points between each pair of waypoints with a small
 * deterministic perpendicular jitter so polylines read like roads rather than
 * ruler-straight lines. Endpoints are preserved exactly.
 */
export function densifyPath(points: LatLng[], segmentsPerLeg = 8): LatLng[] {
  if (points.length < 2) return points.slice()
  const out: LatLng[] = [points[0]!]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const dLat = b.lat - a.lat
    const dLng = b.lng - a.lng
    // Unit perpendicular to the leg direction.
    const len = Math.hypot(dLat, dLng) || 1
    const perpLat = -dLng / len
    const perpLng = dLat / len
    // ~segmentsPerLeg segments per leg (±2), deterministic.
    const segs = Math.max(2, segmentsPerLeg - 2 + Math.floor(densifyRng() * 5))
    for (let s = 1; s < segs; s++) {
      const t = s / segs
      // Jitter peaks mid-leg (sin envelope), ±0.02° max.
      const envelope = Math.sin(t * Math.PI)
      const jitter = (densifyRng() - 0.5) * 0.04 * envelope
      out.push({
        lat: a.lat + dLat * t + perpLat * jitter,
        lng: a.lng + dLng * t + perpLng * jitter,
      })
    }
    out.push(b)
  }
  return out
}
