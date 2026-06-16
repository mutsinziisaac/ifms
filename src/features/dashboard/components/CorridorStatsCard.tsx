import {
  Building2,
  Gauge,
  MapPin,
  Route as RouteIcon,
  Ruler,
  TruckIcon,
  type LucideIcon,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  useEntities,
  useGeozones,
  useLiveVehicles,
  useRoutes,
} from "@/data/hooks"
import { formatKm, formatSpeed } from "@/lib/format"

interface StatRow {
  label: string
  value: string
  icon: LucideIcon
}

export function CorridorStatsCard() {
  const { t } = useTranslation()
  const vehicles = useLiveVehicles()
  const routes = useRoutes().data ?? []
  const geozones = useGeozones().data ?? []
  const entities = useEntities().data ?? []

  const moving = vehicles.filter((v) => v.status === "moving")
  const avgSpeed =
    moving.length > 0
      ? moving.reduce((sum, v) => sum + v.speedKmh, 0) / moving.length
      : 0

  const activeRoutes = routes.filter((r) => r.active)
  const monitoredKm = activeRoutes.reduce((sum, r) => sum + r.distanceKm, 0)
  const onRoute = vehicles.filter((v) => v.routeId !== null).length
  const activeGeozones = geozones.filter((z) => z.visible).length

  const rows: StatRow[] = [
    {
      label: t("dashboard.corridor.monitoredLength"),
      value: formatKm(monitoredKm),
      icon: Ruler,
    },
    {
      label: t("dashboard.corridor.averageFleetSpeed"),
      value: formatSpeed(avgSpeed),
      icon: Gauge,
    },
    {
      label: t("dashboard.corridor.vehiclesOnRoutes"),
      value: t("dashboard.corridor.ofCount", {
        count: onRoute,
        total: vehicles.length,
      }),
      icon: TruckIcon,
    },
    {
      label: t("dashboard.corridor.activeRoutes"),
      value: String(activeRoutes.length),
      icon: RouteIcon,
    },
    {
      label: t("dashboard.corridor.activeGeozones"),
      value: String(activeGeozones),
      icon: MapPin,
    },
    {
      label: t("dashboard.corridor.operatingEntities"),
      value: String(entities.length),
      icon: Building2,
    },
  ]

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>{t("dashboard.corridor.title")}</CardTitle>
        <CardDescription>{t("dashboard.corridor.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="divide-y">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <row.icon className="size-4" />
                </span>
                {row.label}
              </dt>
              <dd className="font-heading text-sm font-semibold tabular-nums">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
