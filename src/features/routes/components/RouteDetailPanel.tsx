import { Link } from "react-router-dom"
import { Gauge, MapPin, Truck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useVehicles } from "@/data/hooks"
import type { RouteDef } from "@/data/types"
import { formatKm } from "@/lib/format"

export interface RouteDetailPanelProps {
  route: RouteDef
}

export function RouteDetailPanel({ route }: RouteDetailPanelProps) {
  const { t } = useTranslation()
  const vehicles = useVehicles().data ?? []
  const assigned = vehicles.filter((v) => v.routeId === route.id)

  return (
    <div className="space-y-4 border-t p-4">
      {route.description ? (
        <p className="text-sm text-muted-foreground">{route.description}</p>
      ) : null}

      {route.startAddress || route.endAddress ? (
        <dl className="space-y-1.5 text-sm">
          <div className="flex gap-2">
            <dt className="w-9 shrink-0 text-xs font-medium text-muted-foreground">
              {t("routes.detail.from")}
            </dt>
            <dd className="min-w-0">{route.startAddress || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-9 shrink-0 text-xs font-medium text-muted-foreground">
              {t("routes.detail.to")}
            </dt>
            <dd className="min-w-0">{route.endAddress || "—"}</dd>
          </div>
        </dl>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Gauge className="size-3.5" />
            {t("routes.detail.distance")}
          </div>
          <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
            {formatKm(route.distanceKm)}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Truck className="size-3.5" />
            {t("routes.detail.vehicles")}
          </div>
          <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">
            {route.assignedItineraryCount ?? assigned.length}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3.5" />
          {t("routes.detail.waypoints")}
        </div>
        <ol className="space-y-1">
          {route.waypoints.map((wp, index) => (
            <li key={wp.id} className="flex items-center gap-2.5">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary tabular-nums">
                {index + 1}
              </span>
              <span className="truncate text-sm">{wp.name}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("routes.detail.assignedVehicles")}
        </p>
        {assigned.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("routes.detail.noneAssigned")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {assigned.map((vehicle) => (
              <Link
                key={vehicle.id}
                to={`/fleet/${vehicle.id}`}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-xs font-medium tabular-nums transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <Truck className="size-3" />
                {vehicle.plate}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
