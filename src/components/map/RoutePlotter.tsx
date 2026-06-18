import { useEffect } from "react"
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps"

import type { LatLng } from "@/data/types"

const PRIMARY = "#0d9488"

export interface RoutePlotterProps {
  /** Vertices plotted so far (owned by the parent so it can drive a toolbar). */
  points: LatLng[]
  /** Called with each map click — the parent appends it to `points`. */
  onAddPoint: (point: LatLng) => void
}

/**
 * Native map-click polyline plotter. The Google Maps `drawing` library (the old
 * `DrawingManager`) was removed in Maps JS v3.65, so the route corridor is drawn
 * with core APIs instead: every map click is a vertex, the running line is drawn
 * with `google.maps.Polyline`, and the parent's toolbar handles undo/finish.
 *
 * Must be rendered as a child of <FleetMap> (it relies on `useMap()`).
 */
export function RoutePlotter({ points, onAddPoint }: RoutePlotterProps) {
  const map = useMap()

  // Each click on the map adds a vertex.
  useEffect(() => {
    if (map === null) return
    const listener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        const latLng = event.latLng
        if (latLng) onAddPoint({ lat: latLng.lat(), lng: latLng.lng() })
      }
    )
    return () => listener.remove()
  }, [map, onAddPoint])

  // Draw the running line imperatively (mirrors RoutePolyline).
  useEffect(() => {
    if (map === null || points.length < 2) return
    const polyline = new google.maps.Polyline({
      path: points,
      strokeColor: PRIMARY,
      strokeWeight: 4,
      strokeOpacity: 0.9,
      clickable: false,
      map,
    })
    return () => polyline.setMap(null)
  }, [map, points])

  // Vertex dots so the user can see each tapped point.
  return (
    <>
      {points.map((point, index) => (
        <AdvancedMarker key={index} position={point}>
          <span
            className="block size-2.5 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: PRIMARY }}
          />
        </AdvancedMarker>
      ))}
    </>
  )
}
