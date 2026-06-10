import { useEffect } from "react"
import { useMap } from "@vis.gl/react-google-maps"

import type { LatLng } from "@/data/types"

export interface TrailPolylineProps {
  path: LatLng[]
  color?: string
}

const DEFAULT_TRAIL_COLOR = "#0d9488"

/** Breadcrumb trail of a vehicle's recent live positions. */
export function TrailPolyline({ path, color }: TrailPolylineProps) {
  const map = useMap()
  const strokeColor = color ?? DEFAULT_TRAIL_COLOR

  useEffect(() => {
    if (map === null || path.length < 2) return

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeOpacity: 0.5,
      strokeWeight: 3,
      clickable: false,
      map,
    })

    return () => {
      polyline.setMap(null)
    }
  }, [map, path, strokeColor])

  return null
}
