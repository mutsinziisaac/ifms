import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  Activity,
  ArrowLeft,
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  MessagesSquare,
  Phone,
  RadioTower,
} from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { EmptyState } from "@/components/common/EmptyState"
import { RelativeTime } from "@/components/common/RelativeTime"
import { Sparkline } from "@/components/common/Sparkline"
import { StatCard } from "@/components/common/StatCard"
import {
  EventSeverityBadge,
  VehicleStatusBadge,
} from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useEntities,
  useEvents,
  useLiveProviderTelemetry,
  useLiveVehicles,
} from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { formatSpeed } from "@/lib/format"
import { computeProviderStats } from "@/lib/provider-stats"

import { ProviderCategoryBadge } from "./components/ProviderCategoryBadge"

const MAX_RECENT_EVENTS = 6

export function ProviderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const entitiesQuery = useEntities()
  const vehicles = useLiveVehicles()
  const telemetry = useLiveProviderTelemetry()
  const events = useEvents().data ?? []

  const entity = (entitiesQuery.data ?? []).find((e) => e.id === id)

  const stats = useMemo(
    () => (entity ? computeProviderStats(entity, vehicles, telemetry) : null),
    [entity, vehicles, telemetry]
  )

  const fleet = useMemo(
    () => vehicles.filter((v) => v.entityId === id),
    [vehicles, id]
  )

  const recentEvents = useMemo(
    () => events.filter((e) => e.entityId === id).slice(0, MAX_RECENT_EVENTS),
    [events, id]
  )

  if (!entitiesQuery.isLoading && !entity) {
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

  if (!entity || !stats) return null

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
        title={entity.name}
        description={`${entity.address} · ${entity.region}`}
        actions={
          <Button variant="outline" onClick={() => navigate("/providers")}>
            <ArrowLeft className="size-4" />
            {t("providers.detail.allProviders")}
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <ProviderCategoryBadge category={entity.category} />
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5" />
            {entity.phone}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="size-3.5" />
            {entity.email}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {entity.region}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <StatCard
            label={t("providers.detail.stats.messagesReceived")}
            value={stats.messagesTotal.toLocaleString()}
            icon={MessagesSquare}
            hint={t("providers.detail.stats.messagesReceivedHint")}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t("providers.detail.transmission.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-28 text-primary">
                <Sparkline data={stats.history} strokeWidth={2} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("providers.detail.transmission.caption")}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader className="flex-row items-center justify-between gap-2">
              <CardTitle>{t("providers.detail.events.title")}</CardTitle>
              <Link
                to={`/events?entity=${entity.id}`}
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
        </div>

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
