import { useEffect, useState } from "react"

import type { LatLng } from "@/data/types"

/**
 * Accumulates a vehicle's recent live positions into a breadcrumb trail,
 * capped at `max` points. Component-level on purpose — the simulation keeps
 * no per-vehicle history, so the trail grows while the page is open and
 * resets on navigation.
 */
export function usePositionTrail(position: LatLng, max = 30): LatLng[] {
  const [trail, setTrail] = useState<LatLng[]>([position])
  const { lat, lng } = position

  useEffect(() => {
    setTrail((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.lat === lat && last.lng === lng) return prev
      const next = [...prev, { lat, lng }]
      return next.length > max ? next.slice(next.length - max) : next
    })
  }, [lat, lng, max])

  return trail
}
