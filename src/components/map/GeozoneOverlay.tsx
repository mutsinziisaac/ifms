import { useEffect } from "react"
import { useMap } from "@vis.gl/react-google-maps"

import { DEFAULT_GEOZONE_COLOR } from "@/lib/geozone-colors"
import type { Geozone } from "@/data/types"

export interface GeozoneOverlayProps {
  zone: Geozone
  color?: string
  selected?: boolean
  onClick?: (zone: Geozone) => void
}

export function GeozoneOverlay(props: GeozoneOverlayProps) {
  const { zone, color, selected, onClick } = props
  const map = useMap()

  const strokeColor = color ?? DEFAULT_GEOZONE_COLOR

  useEffect(() => {
    if (map === null) return

    const options = {
      strokeColor,
      strokeWeight: selected ? 3 : 2,
      strokeOpacity: 0.9,
      fillColor: strokeColor,
      fillOpacity: selected ? 0.25 : 0.12,
      clickable: Boolean(onClick),
    }

    let shape: google.maps.Polygon | google.maps.Circle | null = null

    if (zone.shape === "circle" && zone.radiusM != null) {
      shape = new google.maps.Circle({
        ...options,
        center: zone.center,
        radius: zone.radiusM,
        map,
      })
    } else if (zone.shape === "polygon" && zone.path && zone.path.length >= 3) {
      shape = new google.maps.Polygon({
        ...options,
        paths: zone.path,
        map,
      })
    }

    if (shape === null) return

    const overlay = shape
    const listener = overlay.addListener("click", () => onClick?.(zone))

    return () => {
      listener.remove()
      overlay.setMap(null)
    }
  }, [map, zone, strokeColor, selected, onClick])

  return null
}
