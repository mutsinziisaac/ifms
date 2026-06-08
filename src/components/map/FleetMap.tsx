import { useEffect, useState } from "react"
import {
  ColorScheme,
  Map,
  useMap,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps"
import { Copy, X } from "lucide-react"
import { toast } from "sonner"

import { useTheme } from "@/components/theme-provider"
import { formatCoords } from "@/lib/format"
import type { GeoBounds } from "@/lib/maps"
import type { LatLng } from "@/data/types"
import { cn } from "@/lib/utils"

import { MapPlaceholder } from "./MapPlaceholder"
import { useMapsAvailable } from "./MapsProvider"

export interface FleetMapProps {
  className?: string
  center?: LatLng
  zoom?: number
  bounds?: GeoBounds | null
  children?: React.ReactNode
  showMapTypeControl?: boolean
  enableRightClickCoords?: boolean
  onClick?: (p: LatLng) => void
  id?: string
}

type MapTypeId = "roadmap" | "satellite" | "hybrid"

const MAP_TYPES: { id: MapTypeId; label: string }[] = [
  { id: "roadmap", label: "Map" },
  { id: "satellite", label: "Satellite" },
  { id: "hybrid", label: "Hybrid" },
]

/** Corridor midpoint (Addis Ababa – Djibouti) used as the default view. */
const DEFAULT_CENTER: LatLng = { lat: 9.6, lng: 40.8 }

function resolveScheme(theme: string): ColorScheme {
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme
  return resolved === "dark" ? ColorScheme.DARK : ColorScheme.LIGHT
}

/**
 * Fits the map to `bounds` whenever they change. Rendered inside <Map> so it
 * has access to the map instance via useMap().
 */
function BoundsFitter({ bounds }: { bounds: GeoBounds }) {
  const map = useMap()
  const { north, south, east, west } = bounds

  useEffect(() => {
    if (map === null) return
    map.fitBounds(
      new google.maps.LatLngBounds(
        { lat: south, lng: west },
        { lat: north, lng: east }
      )
    )
  }, [map, north, south, east, west])

  return null
}

export function FleetMap(props: FleetMapProps) {
  const {
    className,
    center,
    zoom = 7,
    bounds,
    children,
    showMapTypeControl = true,
    enableRightClickCoords = true,
    onClick,
    id,
  } = props

  const { theme } = useTheme()
  const available = useMapsAvailable()

  const [mapTypeId, setMapTypeId] = useState<MapTypeId>("roadmap")
  const [coords, setCoords] = useState<LatLng | null>(null)

  // Auto-dismiss the coordinates card after 8s.
  useEffect(() => {
    if (coords === null) return
    const timer = window.setTimeout(() => setCoords(null), 8000)
    return () => window.clearTimeout(timer)
  }, [coords])

  if (!available) {
    return <MapPlaceholder className={className} />
  }

  const scheme = resolveScheme(theme)

  const handleClick = (event: MapMouseEvent) => {
    const latLng = event.detail.latLng
    if (latLng && onClick) onClick({ lat: latLng.lat, lng: latLng.lng })
  }

  const handleContextmenu = (event: MapMouseEvent) => {
    if (!enableRightClickCoords) return
    const latLng = event.detail.latLng
    if (latLng) setCoords({ lat: latLng.lat, lng: latLng.lng })
  }

  const copyCoords = () => {
    if (!coords) return
    void navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`)
    toast.success("Coordinates copied")
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-xl",
        className
      )}
    >
      <Map
        // colorScheme is applied at mount-time only, so key the Map by scheme
        // to force a remount when the theme changes.
        key={scheme}
        id={id}
        mapId="DEMO_MAP_ID"
        className="h-full w-full"
        defaultCenter={center ?? DEFAULT_CENTER}
        defaultZoom={zoom}
        mapTypeId={mapTypeId}
        gestureHandling="greedy"
        disableDefaultUI
        colorScheme={scheme}
        onClick={onClick ? handleClick : undefined}
        onContextmenu={enableRightClickCoords ? handleContextmenu : undefined}
      >
        {bounds ? <BoundsFitter bounds={bounds} /> : null}
        {children}
      </Map>

      {showMapTypeControl ? (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-0.5 rounded-lg border bg-background/90 p-0.5 shadow-sm backdrop-blur">
          {MAP_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setMapTypeId(type.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                mapTypeId === type.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      ) : null}

      {coords ? (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg border bg-background/90 py-1.5 pr-1.5 pl-3 shadow-sm backdrop-blur">
          <span className="font-mono text-xs tabular-nums">
            {formatCoords(coords)}
          </span>
          <button
            type="button"
            onClick={copyCoords}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Copy coordinates"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCoords(null)}
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}
