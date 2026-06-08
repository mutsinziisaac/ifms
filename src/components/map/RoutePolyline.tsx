import { useEffect } from "react"
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps"

import type { LatLng, Waypoint } from "@/data/types"

export interface RoutePolylineProps {
  path: LatLng[]
  color?: string
  active?: boolean
  selected?: boolean
  onClick?: () => void
  waypoints?: Waypoint[]
  showWaypoints?: boolean
}

const DEFAULT_ROUTE_COLOR = "#0d9488"

export function RoutePolyline(props: RoutePolylineProps) {
  const {
    path,
    color,
    active = true,
    selected,
    onClick,
    waypoints,
    showWaypoints,
  } = props
  const map = useMap()

  const strokeColor = color ?? DEFAULT_ROUTE_COLOR

  useEffect(() => {
    if (map === null || path.length < 2) return

    const dashed: google.maps.PolylineOptions = {
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: "M 0,-1 0,1",
            strokeOpacity: 0.6,
            strokeColor,
            scale: 3,
          },
          offset: "0",
          repeat: "18px",
        },
      ],
    }

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeWeight: selected ? 5 : 3.5,
      clickable: Boolean(onClick),
      map,
      ...(active ? { strokeOpacity: 0.9 } : dashed),
    })

    const listener = onClick
      ? polyline.addListener("click", () => onClick())
      : null

    return () => {
      listener?.remove()
      polyline.setMap(null)
    }
  }, [map, path, strokeColor, active, selected, onClick])

  if (!showWaypoints || !waypoints) return null

  return (
    <>
      {waypoints.map((wp) => (
        <AdvancedMarker key={wp.id} position={wp.position}>
          <div className="flex flex-col items-center">
            <span
              className="size-3 rounded-full border-2 bg-background shadow-sm"
              style={{ borderColor: strokeColor }}
            />
            <span className="mt-1 rounded border bg-background/90 px-1.5 py-0.5 text-[10px] shadow-sm">
              {wp.name}
            </span>
          </div>
        </AdvancedMarker>
      ))}
    </>
  )
}
