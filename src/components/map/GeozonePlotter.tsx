import { useEffect, useState } from "react"
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps"

import type { LatLng } from "@/data/types"
import { haversineKm } from "@/lib/maps"

const PRIMARY = "#0d9488"

export type DrawResult =
  | { shape: "polygon"; path: LatLng[] }
  | { shape: "circle"; center: LatLng; radiusM: number }

export interface GeozonePlotterProps {
  mode: "polygon" | "circle"
  /** Polygon vertices so far — owned by the parent so its toolbar can undo/finish. */
  points: LatLng[]
  /** Polygon: called with each map click (parent appends to `points`). */
  onAddPoint: (point: LatLng) => void
  /** Circle: called once the centre and a radius-edge point have both been clicked. */
  onCircleComplete: (center: LatLng, radiusM: number) => void
}

/**
 * Native map-click geozone plotter. The Google Maps `drawing` library (the old
 * `DrawingManager`) was removed in Maps JS v3.65, so shapes are drawn with core
 * APIs instead. Polygons: each click is a vertex, the parent toolbar finishes.
 * Circles: the first click sets the centre, the mouse previews the radius, and a
 * second click resolves it (distance via `haversineKm`).
 *
 * Must be rendered as a child of <FleetMap> (it relies on `useMap()`).
 */
export function GeozonePlotter({
  mode,
  points,
  onAddPoint,
  onCircleComplete,
}: GeozonePlotterProps) {
  const map = useMap()
  const [circleCenter, setCircleCenter] = useState<LatLng | null>(null)
  const [previewRadiusM, setPreviewRadiusM] = useState(0)

  // Each map click: polygon adds a vertex; circle sets the centre, then resolves.
  useEffect(() => {
    if (map === null) return
    const listener = map.addListener(
      "click",
      (event: google.maps.MapMouseEvent) => {
        const latLng = event.latLng
        if (!latLng) return
        const point = { lat: latLng.lat(), lng: latLng.lng() }
        if (mode === "polygon") {
          onAddPoint(point)
          return
        }
        if (circleCenter === null) {
          setCircleCenter(point)
        } else {
          const radiusM = Math.max(
            1,
            Math.round(haversineKm(circleCenter, point) * 1000)
          )
          onCircleComplete(circleCenter, radiusM)
        }
      }
    )
    return () => listener.remove()
  }, [map, mode, circleCenter, onAddPoint, onCircleComplete])

  // Circle: live radius preview as the mouse moves after the centre is placed.
  useEffect(() => {
    if (map === null || mode !== "circle" || circleCenter === null) return
    const listener = map.addListener(
      "mousemove",
      (event: google.maps.MapMouseEvent) => {
        const latLng = event.latLng
        if (!latLng) return
        const here = { lat: latLng.lat(), lng: latLng.lng() }
        setPreviewRadiusM(haversineKm(circleCenter, here) * 1000)
      }
    )
    return () => listener.remove()
  }, [map, mode, circleCenter])

  // Running polygon outline (mirrors GeozoneOverlay's styling).
  useEffect(() => {
    if (map === null || mode !== "polygon" || points.length < 2) return
    const polygon = new google.maps.Polygon({
      paths: points,
      strokeColor: PRIMARY,
      strokeWeight: 2,
      strokeOpacity: 0.9,
      fillColor: PRIMARY,
      fillOpacity: 0.12,
      clickable: false,
      map,
    })
    return () => polygon.setMap(null)
  }, [map, mode, points])

  // Circle preview while the user is picking the radius.
  useEffect(() => {
    if (
      map === null ||
      mode !== "circle" ||
      circleCenter === null ||
      previewRadiusM <= 0
    ) {
      return
    }
    const circle = new google.maps.Circle({
      center: circleCenter,
      radius: previewRadiusM,
      strokeColor: PRIMARY,
      strokeWeight: 2,
      strokeOpacity: 0.9,
      fillColor: PRIMARY,
      fillOpacity: 0.12,
      clickable: false,
      map,
    })
    return () => circle.setMap(null)
  }, [map, mode, circleCenter, previewRadiusM])

  // Vertex dots (polygon) / centre dot (circle) so taps are visible.
  return (
    <>
      {mode === "polygon"
        ? points.map((point, index) => (
            <AdvancedMarker key={index} position={point}>
              <span
                className="block size-2.5 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: PRIMARY }}
              />
            </AdvancedMarker>
          ))
        : null}
      {mode === "circle" && circleCenter ? (
        <AdvancedMarker position={circleCenter}>
          <span
            className="block size-2.5 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: PRIMARY }}
          />
        </AdvancedMarker>
      ) : null}
    </>
  )
}
