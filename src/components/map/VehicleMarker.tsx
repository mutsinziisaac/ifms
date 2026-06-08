import { useState } from "react"
import { AdvancedMarker } from "@vis.gl/react-google-maps"
import { Bus, Car, Fuel, Navigation2, Truck } from "lucide-react"

import { formatRelativeTime, formatSpeed } from "@/lib/format"
import { VEHICLE_STATUS_CONFIG } from "@/lib/status"
import type { Vehicle, VehicleType } from "@/data/types"
import { cn } from "@/lib/utils"

export interface VehicleMarkerProps {
  vehicle: Vehicle
  driverName?: string
  geozoneName?: string
  selected?: boolean
  onClick?: (vehicle: Vehicle) => void
}

function VehicleTypeIcon({
  type,
  className,
}: {
  type: VehicleType
  className?: string
}) {
  switch (type) {
    case "tanker":
      return <Fuel className={className} />
    case "bus":
      return <Bus className={className} />
    case "pickup":
      return <Car className={className} />
    default:
      return <Truck className={className} />
  }
}

export function VehicleMarker(props: VehicleMarkerProps) {
  const { vehicle, driverName, geozoneName, selected, onClick } = props
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
              <p className="text-muted-foreground">
                Driver{" "}
                <span className="font-medium text-foreground">
                  {driverName ?? "Unassigned"}
                </span>
              </p>
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
            "grid size-8 place-items-center rounded-full shadow-md ring-2 ring-white/80 transition-transform dark:ring-black/40",
            selected && "scale-110 ring-2 ring-offset-2"
          )}
          style={{ backgroundColor: config.color }}
        >
          <VehicleTypeIcon type={vehicle.type} className="size-4 text-white" />
          {moving ? (
            <Navigation2
              className="absolute -top-1.5 size-3 text-white drop-shadow"
              style={{ transform: `rotate(${vehicle.heading}deg)` }}
              fill="currentColor"
            />
          ) : null}
        </div>
      </div>
    </AdvancedMarker>
  )
}
