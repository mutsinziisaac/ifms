import { useEffect } from "react"
import { useMap } from "@vis.gl/react-google-maps"

import type { LatLng } from "@/data/types"

export interface FollowCameraProps {
  position: LatLng
  enabled: boolean
}

/** Pans the map to keep `position` centered while `enabled`. */
export function FollowCamera({ position, enabled }: FollowCameraProps) {
  const map = useMap()
  const { lat, lng } = position

  useEffect(() => {
    if (map === null || !enabled) return
    map.panTo({ lat, lng })
  }, [map, enabled, lat, lng])

  return null
}
