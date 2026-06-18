import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Copy, MapPin, Map as MapIcon, Navigation2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { RelativeTime } from "@/components/common/RelativeTime"
import { VehicleStatusBadge } from "@/components/common/status-badges"
import { FleetMap } from "@/components/map/FleetMap"
import { FollowCamera } from "@/components/map/FollowCamera"
import { RoutePolyline } from "@/components/map/RoutePolyline"
import { TrailPolyline } from "@/components/map/TrailPolyline"
import { VehicleMarker } from "@/components/map/VehicleMarker"
import { useGeozones, useLiveVehicles, useRoutes } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { formatCoords, formatSpeed } from "@/lib/format"
import { boundsOf, padBounds } from "@/lib/maps"

import { usePositionTrail } from "../hooks/usePositionTrail"

export function VehicleMapCard({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation()
  const geozones = useGeozones().data ?? []
  const routes = useRoutes().data ?? []
  const [copied, setCopied] = useState(false)
  const [follow, setFollow] = useState(true)

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

  const trail = usePositionTrail(live.position)

  // Fit once on mount — the live position is followed via FollowCamera, so
  // refitting bounds every tick would fight user panning.
  const [initialBounds] = useState(() => {
    const raw = boundsOf([vehicle.position])
    return raw ? padBounds(raw) : null
  })

  const handleShare = () => {
    void navigator.clipboard
      .writeText(`${vehicle.plate} — ${formatCoords(live.position)}`)
      .then(() => {
        setCopied(true)
        toast.success(t("vehicles.detail.map.locationCopied"))
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => toast.error(t("vehicles.detail.map.copyFailed")))
  }

  return (
    <Card className="gap-0 p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t("vehicles.detail.map.title")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="follow-vehicle"
              checked={follow}
              onCheckedChange={setFollow}
              size="sm"
            />
            <label
              htmlFor="follow-vehicle"
              className="cursor-pointer text-xs font-medium"
            >
              {t("vehicles.detail.map.follow")}
            </label>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare}>
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {t("vehicles.detail.map.shareLocation")}
          </Button>
        </div>
      </div>
      <div className="h-[420px] overflow-hidden rounded-xl border">
        <FleetMap bounds={initialBounds} center={live.position} zoom={13}>
          {route ? (
            <RoutePolyline
              path={route.path}
              waypoints={route.waypoints}
              showWaypoints
              active={route.active}
            />
          ) : null}
          <TrailPolyline path={trail} />
          <VehicleMarker
            vehicle={live}
            geozoneName={geozone?.name}
            selected
          />
          <FollowCamera position={live.position} enabled={follow} />
        </FleetMap>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <VehicleStatusBadge status={live.status} />
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Navigation2
            className="size-3.5 text-primary"
            style={{ transform: `rotate(${Math.round(live.heading)}deg)` }}
          />
          {formatSpeed(live.speedKmh)}
          <span className="text-xs text-muted-foreground">
            · {Math.round(live.heading)}°
          </span>
        </span>
        {geozone ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5" />
            {geozone.name}
          </span>
        ) : null}
        <span className="ml-auto text-xs text-muted-foreground">
          {t("vehicles.detail.map.synced")}{" "}
          <RelativeTime iso={live.lastSyncAt} />
        </span>
      </div>
    </Card>
  )
}
