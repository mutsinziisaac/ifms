// Pure geo math used by the map components and the simulation engine.

import type { Geozone, LatLng } from "@/data/types"

const EARTH_RADIUS_KM = 6371
const EARTH_RADIUS_M = EARTH_RADIUS_KM * 1000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Initial bearing from a to b, degrees clockwise from north (0..360) */
export function headingBetween(a: LatLng, b: LatLng): number {
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

export function pathLengthKm(path: LatLng[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++) {
    total += haversineKm(path[i - 1]!, path[i]!)
  }
  return total
}

/**
 * Position + heading at fraction `t` (0..1) of the way along a polyline,
 * measured by distance. Clamps t to [0, 1].
 */
export function interpolateAlongPath(
  path: LatLng[],
  t: number
): { position: LatLng; heading: number } {
  if (path.length === 0) {
    return { position: { lat: 0, lng: 0 }, heading: 0 }
  }
  if (path.length === 1) {
    return { position: path[0]!, heading: 0 }
  }
  const clamped = Math.min(1, Math.max(0, t))
  const total = pathLengthKm(path)
  let target = total * clamped
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!
    const b = path[i]!
    const seg = haversineKm(a, b)
    if (target <= seg || i === path.length - 1) {
      const f = seg === 0 ? 0 : Math.min(1, target / seg)
      return {
        position: {
          lat: a.lat + (b.lat - a.lat) * f,
          lng: a.lng + (b.lng - a.lng) * f,
        },
        heading: headingBetween(a, b),
      }
    }
    target -= seg
  }
  return { position: path[path.length - 1]!, heading: 0 }
}

/**
 * Destination point reached by travelling `meters` from `point` along
 * `bearingDeg` (clockwise from north). Used by the simulation to nudge a
 * vehicle laterally off its corridor.
 */
export function offsetLatLng(
  point: LatLng,
  bearingDeg: number,
  meters: number
): LatLng {
  const angular = meters / EARTH_RADIUS_M
  const brng = toRad(bearingDeg)
  const lat1 = toRad(point.lat)
  const lng1 = toRad(point.lng)
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(brng)
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    )
  return { lat: toDeg(lat2), lng: toDeg(lng2) }
}

/** Distance in metres from origin (a local projection) to segment a→b. */
function distanceToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  // Local equirectangular projection (metres) centred on p — accurate for the
  // short segments of a densified route polyline.
  const latRef = toRad(p.lat)
  const px = (q: LatLng) =>
    toRad(q.lng - p.lng) * Math.cos(latRef) * EARTH_RADIUS_M
  const py = (q: LatLng) => toRad(q.lat - p.lat) * EARTH_RADIUS_M
  const ax = px(a)
  const ay = py(a)
  const dx = px(b) - ax
  const dy = py(b) - ay
  const lenSq = dx * dx + dy * dy
  // Closest-point parameter of the origin onto the segment, clamped to [0, 1].
  let t = lenSq === 0 ? 0 : -(ax * dx + ay * dy) / lenSq
  t = Math.min(1, Math.max(0, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.sqrt(cx * cx + cy * cy)
}

/** Minimum distance in metres from a point to a polyline. */
export function distanceToPolylineMeters(point: LatLng, path: LatLng[]): number {
  if (path.length === 0) return 0
  if (path.length === 1) return haversineKm(point, path[0]!) * 1000
  let min = Infinity
  for (let i = 1; i < path.length; i++) {
    const d = distanceToSegmentMeters(point, path[i - 1]!, path[i]!)
    if (d < min) min = d
  }
  return min
}

export function pointInCircle(
  p: LatLng,
  center: LatLng,
  radiusM: number
): boolean {
  return haversineKm(p, center) * 1000 <= radiusM
}

/** Ray-casting point-in-polygon */
export function pointInPolygon(p: LatLng, polygon: LatLng[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!
    const b = polygon[j]!
    const intersects =
      a.lng > p.lng !== b.lng > p.lng &&
      p.lat < ((b.lat - a.lat) * (p.lng - a.lng)) / (b.lng - a.lng) + a.lat
    if (intersects) inside = !inside
  }
  return inside
}

export function isInsideGeozone(p: LatLng, zone: Geozone): boolean {
  if (zone.shape === "circle" && zone.radiusM != null) {
    return pointInCircle(p, zone.center, zone.radiusM)
  }
  if (zone.shape === "polygon" && zone.path && zone.path.length >= 3) {
    return pointInPolygon(p, zone.path)
  }
  return false
}

export function centroidOf(path: LatLng[]): LatLng {
  if (path.length === 0) return { lat: 0, lng: 0 }
  const sum = path.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  )
  return { lat: sum.lat / path.length, lng: sum.lng / path.length }
}

export interface GeoBounds {
  north: number
  south: number
  east: number
  west: number
}

export function boundsOf(points: LatLng[]): GeoBounds | null {
  if (points.length === 0) return null
  let north = -90
  let south = 90
  let east = -180
  let west = 180
  for (const p of points) {
    north = Math.max(north, p.lat)
    south = Math.min(south, p.lat)
    east = Math.max(east, p.lng)
    west = Math.min(west, p.lng)
  }
  return { north, south, east, west }
}

/** Pad bounds by a fraction of their span so markers don't hug edges */
export function padBounds(bounds: GeoBounds, fraction = 0.1): GeoBounds {
  const latPad = Math.max(0.01, (bounds.north - bounds.south) * fraction)
  const lngPad = Math.max(0.01, (bounds.east - bounds.west) * fraction)
  return {
    north: bounds.north + latPad,
    south: bounds.south - latPad,
    east: bounds.east + lngPad,
    west: bounds.west - lngPad,
  }
}
