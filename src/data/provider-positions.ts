// Dummy per-provider vehicle positions. There is no backend endpoint that lists
// a provider's vehicles/positions yet, so the Provider detail page renders this
// stable, seeded data instead. The output mirrors the agreed positions wire
// payload (provider_code + a positions[] batch) so swapping in the real endpoint
// is a one-line change in api.getProviderPositions. The PRNG is seeded by the
// provider code, so a provider's fleet stays identical across reloads and
// navigations (timestamps stay anchored to the live clock so "x min ago" reads
// fresh — same approach as src/data/seed.ts).

import type { LatLng } from "./types"
import type {
  ProviderPositionItem,
  ProviderPositionsResponse,
} from "./mappers"

// The monitored Addis Ababa → Dire Dawa → Djibouti freight corridor. Positions
// are scattered along this polyline so the dummy fleet reads as corridor traffic.
const CORRIDOR: LatLng[] = [
  { lat: 9.0301, lng: 38.7468 }, // Addis Ababa
  { lat: 9.5931, lng: 41.8661 }, // Dire Dawa
  { lat: 11.572, lng: 43.145 }, // Djibouti City
]

const MOVEMENT_STATES = ["MOVING", "IDLING", "STOPPED", "OFFLINE"] as const

// Hard cap so an outsized `submitted` tally can't generate a pathological batch.
const MAX_POSITIONS = 250

// mulberry32 — the same small, deterministic PRNG used by the seed.
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

// Stable FNV-1a hash of the provider code → a per-provider PRNG seed.
function hashCode(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function round(n: number, digits: number): number {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

// A point at fraction f∈[0,1] along the corridor polyline, with a little jitter.
function alongCorridor(f: number, jitterDeg: number, rand: () => number): LatLng {
  const segments = CORRIDOR.length - 1
  const scaled = Math.min(Math.max(f, 0), 0.9999) * segments
  const i = Math.floor(scaled)
  const tt = scaled - i
  const a = CORRIDOR[i]!
  const b = CORRIDOR[i + 1]!
  return {
    lat: a.lat + (b.lat - a.lat) * tt + (rand() - 0.5) * 2 * jitterDeg,
    lng: a.lng + (b.lng - a.lng) * tt + (rand() - 0.5) * 2 * jitterDeg,
  }
}

/**
 * Generate a stable, seeded positions batch for a provider. `count` ties the
 * fleet size to the provider's submitted-vehicle tally so the list matches the
 * detail page's stat card; it's clamped to [0, MAX_POSITIONS].
 */
export function generateProviderPositions(
  code: string,
  count: number
): ProviderPositionsResponse {
  const seed = hashCode(code)
  const rand = mulberry32(seed)
  const now = Date.now()
  // Size the fleet to the provider's submitted tally. When that's unknown (0),
  // fall back to a deterministic per-provider count so every provider's detail
  // page still shows a fleet ("dummy data for all providers").
  const requested = Math.floor(count) > 0 ? Math.floor(count) : 8 + (seed % 17)
  const n = Math.min(requested, MAX_POSITIONS)

  const positions: ProviderPositionItem[] = []
  for (let i = 0; i < n; i++) {
    const movement = MOVEMENT_STATES[Math.floor(rand() * MOVEMENT_STATES.length)]!
    const moving = movement === "MOVING"
    const idling = movement === "IDLING"
    const offline = movement === "OFFLINE"

    const pos = alongCorridor(rand(), 0.06, rand)
    const speedKmh = moving
      ? Math.round(25 + rand() * 70)
      : idling
        ? Math.round(rand() * 5)
        : 0
    // Offline devices last reported up to a couple of hours ago; others minutes.
    const recordedMinsAgo = offline
      ? 60 + Math.floor(rand() * 90)
      : Math.floor(rand() * 30)
    const plateCode = 1 + Math.floor(rand() * 4)
    const plateDigits = String(Math.floor(rand() * 100000)).padStart(5, "0")
    const imei = `35${String(Math.floor(rand() * 1e13)).padStart(13, "0")}`

    positions.push({
      vehicle_plate_number: `${plateCode}-${plateDigits} ET`,
      recorded_at: new Date(now - recordedMinsAgo * 60_000).toISOString(),
      latitude: round(pos.lat, 5),
      longitude: round(pos.lng, 5),
      speed_kmh: speedKmh,
      heading_degrees: Math.floor(rand() * 360),
      ignition_on: moving || idling,
      odometer_km: Math.round(30000 + rand() * 230000),
      message_id: `${code.toLowerCase()}-${String(i).padStart(4, "0")}-${Math.floor(rand() * 1e6)}`,
      accuracy_meters: round(3 + rand() * 22, 1),
      altitude_meters: Math.round(1000 + rand() * 1400),
      movement_status: movement,
      device_imei: imei,
      extras: {
        network: rand() < 0.7 ? "LTE" : "GSM",
        satellites: String(6 + Math.floor(rand() * 8)),
        firmware: `v2.${1 + Math.floor(rand() * 6)}.${Math.floor(rand() * 10)}`,
      },
    })
  }

  return {
    provider_code: code,
    sent_at: new Date(now).toISOString(),
    sequence: 0,
    positions,
  }
}
