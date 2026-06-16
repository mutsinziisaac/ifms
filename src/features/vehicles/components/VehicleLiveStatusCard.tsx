import { useMemo } from "react"
import {
  Activity,
  Fuel,
  Gauge,
  MapPin,
  Route as RouteIcon,
  Satellite,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { RelativeTime } from "@/components/common/RelativeTime"
import { VehicleStatusBadge } from "@/components/common/status-badges"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useGeozones, useLiveVehicles, useRoutes } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import {
  formatCoords,
  formatDateTime,
  formatKm,
  formatSpeed,
  formatStatusDuration,
} from "@/lib/format"
import { cn } from "@/lib/utils"

function InfoRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  )
}

export function VehicleLiveStatusCard({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation()
  const geozones = useGeozones().data ?? []
  const routes = useRoutes().data ?? []

  // Live store version keeps speed / position / status fresh.
  const liveVehicles = useLiveVehicles()
  const live = useMemo(
    () => liveVehicles.find((v) => v.id === vehicle.id) ?? vehicle,
    [liveVehicles, vehicle]
  )

  const geozone = live.insideGeozoneId
    ? geozones.find((g) => g.id === live.insideGeozoneId)
    : undefined
  const route = live.routeId
    ? routes.find((r) => r.id === live.routeId)
    : undefined

  const locationLabel = geozone
    ? geozone.name
    : t("vehicles.detail.live.onCorridor")
  const routeLabel = route ? route.name : "—"

  return (
    <Card className="h-full gap-0 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {t("vehicles.detail.live.title")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-8">
        <div className="divide-y">
          <InfoRow label={t("vehicles.detail.live.status")}>
            <span className="inline-flex items-center gap-2">
              <VehicleStatusBadge status={live.status} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatStatusDuration(live.statusSince)}
              </span>
            </span>
          </InfoRow>
          <InfoRow label={t("vehicles.detail.live.location")}>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              {locationLabel}
            </span>
          </InfoRow>
          <InfoRow label={t("vehicles.detail.live.route")}>
            <span className="inline-flex items-center gap-1.5">
              <RouteIcon className="size-3.5 text-muted-foreground" />
              {routeLabel}
            </span>
          </InfoRow>
          <InfoRow label={t("vehicles.detail.live.coordinates")}>
            <span className="font-mono text-xs tabular-nums">
              {formatCoords(live.position)}
            </span>
          </InfoRow>
        </div>

        <div className="divide-y">
          <InfoRow label={t("vehicles.detail.live.speed")}>
            <span className="tabular-nums">
              {live.status === "moving" ? formatSpeed(live.speedKmh) : "—"}
            </span>
          </InfoRow>
          <InfoRow label={t("vehicles.detail.live.odometer")}>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Gauge className="size-3.5 text-muted-foreground" />
              {formatKm(live.odometerKm)}
            </span>
          </InfoRow>
          <InfoRow label={t("vehicles.detail.live.lastSync")}>
            <span className="inline-flex flex-col items-end">
              <span className="inline-flex items-center gap-1.5">
                <Satellite className="size-3.5 text-muted-foreground" />
                {formatDateTime(live.lastSyncAt)}
              </span>
              <RelativeTime
                iso={live.lastSyncAt}
                className="text-xs font-normal text-muted-foreground"
              />
            </span>
          </InfoRow>
          <div className="py-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Fuel className="size-3.5" />
                {t("vehicles.detail.live.fuelLevel")}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {Math.round(live.fuelPct)}%
              </span>
            </div>
            <Progress
              value={live.fuelPct}
              className={cn(
                "h-2",
                live.fuelPct < 20 &&
                  "[&_[data-slot=progress-indicator]]:bg-rose-500"
              )}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
