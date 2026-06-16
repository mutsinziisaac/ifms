// Helpers for attributing travel history to the driver who was at the wheel,
// derived from the vehicle's assignment chain (single source of truth — no
// driver link is stored on trips). Shared by the assignment timeline and the
// travel-history section so colors stay consistent between them.

import type { ID, VehicleDriverAssignment } from "@/data/types"

/** Distinct, legible trail colors cycled per driver (oklch teal/gold theme). */
export const DRIVER_TRAIL_COLORS = [
  "#0d9488", // teal
  "#d97706", // amber
  "#6366f1", // indigo
  "#db2777", // pink
  "#0891b2", // cyan
  "#65a30d", // lime
] as const

/** The driver assigned at a given instant, or null if none covers it. */
export function driverIdAt(
  assignments: VehicleDriverAssignment[],
  iso: string
): ID | null {
  const t = +new Date(iso)
  for (const a of assignments) {
    const start = +new Date(a.startAt)
    const end = a.endAt === null ? Infinity : +new Date(a.endAt)
    if (t >= start && t < end) return a.driverId
  }
  return null
}

/**
 * Stable driverId -> color map. Drivers are colored in the order they appear
 * in the (newest-first) assignment list so the current driver gets the first
 * color in both the timeline and the trail legend.
 */
export function buildDriverColorMap(
  assignments: VehicleDriverAssignment[]
): Map<ID, string> {
  const map = new Map<ID, string>()
  for (const a of assignments) {
    if (!map.has(a.driverId)) {
      map.set(
        a.driverId,
        DRIVER_TRAIL_COLORS[map.size % DRIVER_TRAIL_COLORS.length]!
      )
    }
  }
  return map
}
