import { useMemo, useState } from "react"
import { Check, Copy, Map as MapIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FleetMap } from "@/components/map/FleetMap"
import { VehicleMarker } from "@/components/map/VehicleMarker"
import { useDrivers, useGeozones, useLiveVehicles } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { formatCoords, fullName } from "@/lib/format"
import { boundsOf, padBounds } from "@/lib/maps"

export function VehicleMapCard({ vehicle }: { vehicle: Vehicle }) {
  const drivers = useDrivers().data ?? []
  const geozones = useGeozones().data ?? []
  const [copied, setCopied] = useState(false)

  const liveVehicles = useLiveVehicles()
  const live = useMemo(
    () => liveVehicles.find((v) => v.id === vehicle.id) ?? vehicle,
    [liveVehicles, vehicle]
  )

  const driver = live.driverId
    ? drivers.find((d) => d.id === live.driverId)
    : undefined
  const geozone = live.insideGeozoneId
    ? geozones.find((g) => g.id === live.insideGeozoneId)
    : undefined

  const rawBounds = boundsOf([live.position])
  const bounds = rawBounds ? padBounds(rawBounds) : null

  const handleShare = () => {
    void navigator.clipboard
      .writeText(`${vehicle.plate} — ${formatCoords(live.position)}`)
      .then(() => {
        setCopied(true)
        toast.success("Location copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => toast.error("Could not copy location"))
  }

  return (
    <Card className="gap-0 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Map</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare}>
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          Share location
        </Button>
      </div>
      <div className="h-[360px] overflow-hidden rounded-xl border">
        <FleetMap bounds={bounds} center={live.position} zoom={13}>
          <VehicleMarker
            vehicle={live}
            driverName={driver ? fullName(driver) : undefined}
            geozoneName={geozone?.name}
            selected
          />
        </FleetMap>
      </div>
    </Card>
  )
}
