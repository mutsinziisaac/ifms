import { useEffect, useRef } from "react"
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps"

import type { LatLng } from "@/data/types"

export type DrawResult =
  | { shape: "polygon"; path: LatLng[] }
  | { shape: "circle"; center: LatLng; radiusM: number }

export interface DrawingManagerProps {
  mode: "polygon" | "circle" | null
  onComplete: (result: DrawResult) => void
}

const PRIMARY = "#0d9488"

// The `google.maps.drawing` namespace is marked deprecated and stripped to an
// empty class in the bundled @types, so we describe the runtime surface we use.
interface DrawingManagerInstance extends google.maps.MVCObject {
  setMap(map: google.maps.Map | null): void
  setDrawingMode(mode: string | null): void
}

interface OverlayCompleteEvent {
  type: string
  overlay: google.maps.Polygon | google.maps.Circle
}

type DrawingManagerCtor = new (
  options: Record<string, unknown>
) => DrawingManagerInstance

export function DrawingManager(props: DrawingManagerProps) {
  const { mode, onComplete } = props
  const map = useMap()
  const drawing = useMapsLibrary("drawing")

  const managerRef = useRef<DrawingManagerInstance | null>(null)

  useEffect(() => {
    if (map === null || drawing === null) return

    const Ctor = drawing.DrawingManager as unknown as DrawingManagerCtor
    const manager = new Ctor({
      drawingControl: false,
      polygonOptions: {
        strokeColor: PRIMARY,
        strokeWeight: 2,
        fillColor: PRIMARY,
        fillOpacity: 0.15,
      },
      circleOptions: {
        strokeColor: PRIMARY,
        strokeWeight: 2,
        fillColor: PRIMARY,
        fillOpacity: 0.15,
      },
    })
    manager.setMap(map)
    managerRef.current = manager

    const listener = manager.addListener(
      "overlaycomplete",
      (event: OverlayCompleteEvent) => {
        if (event.type === "polygon") {
          const polygon = event.overlay as google.maps.Polygon
          const path = polygon
            .getPath()
            .getArray()
            .map((p) => ({ lat: p.lat(), lng: p.lng() }))
          polygon.setMap(null)
          onComplete({ shape: "polygon", path })
        } else if (event.type === "circle") {
          const circle = event.overlay as google.maps.Circle
          const center = circle.getCenter()
          circle.setMap(null)
          // Always resolve so the page can exit drawing mode; fall back to the
          // map centre on the (practically impossible) null center.
          const resolved = center ?? map.getCenter()
          onComplete({
            shape: "circle",
            center: resolved
              ? { lat: resolved.lat(), lng: resolved.lng() }
              : { lat: 9.6, lng: 40.8 },
            radiusM: circle.getRadius(),
          })
        }
      }
    )

    return () => {
      listener.remove()
      manager.setMap(null)
      managerRef.current = null
    }
  }, [map, drawing, onComplete])

  // Drive drawing mode reactively from the prop.
  useEffect(() => {
    const manager = managerRef.current
    if (manager === null || drawing === null) return
    const overlayType =
      mode === "polygon"
        ? drawing.OverlayType.POLYGON
        : mode === "circle"
          ? drawing.OverlayType.CIRCLE
          : null
    manager.setDrawingMode(overlayType)
  }, [mode, drawing])

  return null
}
