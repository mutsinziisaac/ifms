import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  Activity,
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock,
  Hash,
  RadioTower,
} from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { EmptyState } from "@/components/common/EmptyState"
import { RelativeTime } from "@/components/common/RelativeTime"
import { StatCard } from "@/components/common/StatCard"
import {
  EventSeverityBadge,
  VehicleStatusBadge,
} from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEvents, useLiveVehicles, useProviders } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { formatSpeed } from "@/lib/format"
import { computeProviderStats } from "@/lib/provider-stats"

const MAX_RECENT_EVENTS = 6

export function ProviderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const providersQuery = useProviders()
  const vehicles = useLiveVehicles()
  const events = useEvents().data ?? []

  const provider = (providersQuery.data ?? []).find((p) => p.id === id)
  const code = provider?.code

  const stats = useMemo(
    () => (code ? computeProviderStats(code, vehicles) : null),
    [code, vehicles]
  )

  const fleet = useMemo(
    () => (code ? vehicles.filter((v) => v.entityId === code) : []),
    [vehicles, code]
  )

  const recentEvents = useMemo(
    () => events.filter((e) => e.entityId === id).slice(0, MAX_RECENT_EVENTS),
    [events, id]
  )

  if (!providersQuery.isLoading && !provider) {
    return (
      <EmptyState
        icon={Building2}
        title={t("providers.detail.notFoundTitle")}
        description={t("providers.detail.notFoundDescription")}
        action={
          <Button onClick={() => navigate("/providers")}>
            <ArrowLeft className="size-4" />
            {t("providers.detail.backToProviders")}
          </Button>
        }
      />
    )
  }

  if (!provider || !stats) return null

  const deviceColumns: DataTableColumn<Vehicle>[] = [
    {
      key: "plate",
      header: t("providers.detail.devicesTable.plate"),
      render: (v) => (
        <span className="font-mono text-sm font-medium tabular-nums">
          {v.plate}
        </span>
      ),
    },
    {
      key: "type",
      header: t("providers.detail.devicesTable.type"),
      render: (v) => (
        <span className="text-sm">{t(`enums.vehicleType.${v.type}`)}</span>
      ),
    },
    {
      key: "status",
      header: t("providers.detail.devicesTable.status"),
      render: (v) => <VehicleStatusBadge status={v.status} />,
    },
    {
      key: "gpsProvider",
      header: t("providers.detail.devicesTable.gpsDevice"),
      render: (v) => (
        <span className="text-sm text-muted-foreground">{v.gpsProvider}</span>
      ),
    },
    {
      key: "speed",
      header: t("providers.detail.devicesTable.speed"),
      render: (v) => (
        <span className="text-sm tabular-nums">{formatSpeed(v.speedKmh)}</span>
      ),
    },
    {
      key: "lastSync",
      header: t("providers.detail.devicesTable.lastSync"),
      render: (v) => (
        <RelativeTime
          iso={v.lastSyncAt}
          className="text-sm text-muted-foreground"
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={provider.code}
        actions={
          <Button variant="outline" onClick={() => navigate("/providers")}>
            <ArrowLeft className="size-4" />
            {t("providers.detail.allProviders")}
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Badge variant={provider.active ? "default" : "secondary"}>
            {provider.active ? t("providers.active") : t("providers.inactive")}
          </Badge>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Hash className="size-3.5" />
            {provider.id}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {t("providers.detail.added")}{" "}
            <RelativeTime iso={provider.createdAt} />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {t("providers.detail.updated")}{" "}
            <RelativeTime iso={provider.modifiedAt} />
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label={t("providers.detail.stats.devices")}
            value={stats.deviceCount}
            icon={RadioTower}
            hint={t("providers.detail.stats.devicesHint", {
              count: stats.onlineCount,
            })}
          />
          <StatCard
            label={t("providers.detail.stats.fleetOnline")}
            value={`${stats.onlinePct}%`}
            icon={Activity}
            intent={stats.onlinePct >= 90 ? "success" : "warning"}
            hint={
              stats.noSignalCount > 0
                ? t("providers.detail.stats.fleetOnlineHint", {
                    count: stats.noSignalCount,
                  })
                : t("providers.detail.stats.allReporting")
            }
          />
          <StatCard
            label={t("providers.detail.stats.lastSync")}
            value={
              stats.lastSyncAt ? <RelativeTime iso={stats.lastSyncAt} /> : "—"
            }
            icon={RadioTower}
            hint={t("providers.detail.stats.lastSyncHint")}
          />
        </div>

        <Card className="gap-0">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>{t("providers.detail.events.title")}</CardTitle>
            <Link
              to={`/events?entity=${provider.id}`}
              className="flex items-center gap-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t("providers.detail.events.viewAll")}
              <ChevronRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {recentEvents.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                {t("providers.detail.events.empty")}
              </p>
            ) : (
              <ul className="divide-y">
                {recentEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {t(`enums.eventType.${event.type}`)} ·{" "}
                        {event.vehiclePlate}
                      </p>
                      <RelativeTime
                        iso={event.at}
                        className="text-xs text-muted-foreground"
                      />
                    </div>
                    <EventSeverityBadge severity={event.severity} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <DataTable
          data={fleet}
          columns={deviceColumns}
          onRowClick={(v) => navigate(`/fleet/${v.id}`)}
          emptyTitle={t("providers.detail.devicesTable.emptyTitle")}
          emptyDescription={t("providers.detail.devicesTable.emptyDescription")}
        />
      </div>
    </div>
  )
}
