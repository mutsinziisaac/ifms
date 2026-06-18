import { useState } from "react"
import { AdvancedMarker } from "@vis.gl/react-google-maps"
import { Navigation2 } from "lucide-react"

import { formatRelativeTime, formatSpeed } from "@/lib/format"
import { VEHICLE_STATUS_CONFIG } from "@/lib/status"
import type { Vehicle } from "@/data/types"
import { cn } from "@/lib/utils"

export interface VehicleMarkerProps {
  vehicle: Vehicle
  geozoneName?: string
  selected?: boolean
  onClick?: (vehicle: Vehicle) => void
}

export function VehicleMarker(props: VehicleMarkerProps) {
  const { vehicle, geozoneName, selected, onClick } = props
  const [hovered, setHovered] = useState(false)

  const config = VEHICLE_STATUS_CONFIG[vehicle.status]
  const moving = vehicle.status === "moving"
  const active = hovered || selected

  return (
    <AdvancedMarker
      position={vehicle.position}
      zIndex={active ? 1000 : undefined}
      onClick={() => onClick?.(vehicle)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative">
        {hovered ? (
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-56 -translate-x-1/2 rounded-lg border bg-popover p-3 text-left shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{vehicle.plate}</span>
              <span
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                  config.badgeClass
                )}
              >
                {config.label}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-xs">
              {moving ? (
                <p className="text-muted-foreground">
                  Speed{" "}
                  <span className="font-medium text-foreground">
                    {formatSpeed(vehicle.speedKmh)}
                  </span>
                </p>
              ) : null}
              {geozoneName ? (
                <p className="text-muted-foreground">
                  Inside{" "}
                  <span className="font-medium text-foreground">
                    {geozoneName}
                  </span>
                </p>
              ) : null}
              <p className="pt-0.5 text-xs text-muted-foreground">
                {formatRelativeTime(vehicle.lastSyncAt)}
              </p>
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "relative transition-transform",
            selected && "scale-110"
          )}
        >
          <img
            src="/truck.png"
            alt=""
            draggable={false}
            className="h-12 w-20 object-contain drop-shadow-md"
          />
          {moving ? (
            <Navigation2
              className="absolute -top-1.5 left-1/2 size-3 drop-shadow"
              style={{
                color: config.color,
                transform: `translateX(-50%) rotate(${vehicle.heading}deg)`,
              }}
              fill="currentColor"
            />
          ) : null}
        </div>
      </div>
    </AdvancedMarker>
  )
}
