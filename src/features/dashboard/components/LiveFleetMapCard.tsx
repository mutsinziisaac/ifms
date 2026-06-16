import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FleetMap } from "@/components/map/FleetMap"
import { GeozoneOverlay } from "@/components/map/GeozoneOverlay"
import { RoutePolyline } from "@/components/map/RoutePolyline"
import { VehicleMarker } from "@/components/map/VehicleMarker"
import {
  useDrivers,
  useGeozones,
  useLiveVehicles,
  useRoutes,
} from "@/data/hooks"
import { fullName } from "@/lib/format"
import { boundsOf, padBounds } from "@/lib/maps"
import { VEHICLE_STATUS_CONFIG } from "@/lib/status"
import { VEHICLE_STATUSES, type Vehicle } from "@/data/types"

export function LiveFleetMapCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const vehicles = useLiveVehicles()
  const drivers = useDrivers().data ?? []
  const geozones = useGeozones().data ?? []
  const routes = useRoutes().data ?? []

  const driverNameById = useMemo(
    () => new Map(drivers.map((d) => [d.id, fullName(d)])),
    [drivers]
  )
  const geozoneNameById = useMemo(
    () => new Map(geozones.map((z) => [z.id, z.name])),
    [geozones]
  )

  const bounds = useMemo(() => {
    const points = vehicles.map((v) => v.position)
    const base = boundsOf(points)
    return base ? padBounds(base, 0.18) : null
  }, [vehicles])

  const poiZones = geozones.filter((z) => z.isPOI && z.visible)
  const activeRoutes = routes.filter((r) => r.active)

  return (
    <Card className="relative h-full gap-0 overflow-hidden before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[3px] before:bg-gradient-to-r before:from-amber-400 before:via-amber-500 before:to-transparent">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          {t("dashboard.liveFleet.title")}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {VEHICLE_STATUSES.map((status) => (
            <span
              key={status}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: VEHICLE_STATUS_CONFIG[status].color }}
              />
              {t(`enums.vehicleStatus.${status}`)}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-0 pt-4">
        <div className="min-h-[460px] flex-1">
          <FleetMap
            bounds={bounds}
            className="rounded-none"
            enableRightClickCoords={false}
          >
            {activeRoutes.map((route) => (
              <RoutePolyline
                key={route.id}
                path={route.path}
                active={false}
                color="#0d9488"
              />
            ))}
            {poiZones.map((zone) => (
              <GeozoneOverlay key={zone.id} zone={zone} color="#64748b" />
            ))}
            {vehicles.map((vehicle: Vehicle) => (
              <VehicleMarker
                key={vehicle.id}
                vehicle={vehicle}
                driverName={
                  vehicle.driverId
                    ? driverNameById.get(vehicle.driverId)
                    : undefined
                }
                geozoneName={
                  vehicle.insideGeozoneId
                    ? geozoneNameById.get(vehicle.insideGeozoneId)
                    : undefined
                }
                onClick={(v) => navigate(`/fleet/${v.id}`)}
              />
            ))}
          </FleetMap>
        </div>
      </CardContent>
    </Card>
  )
}
