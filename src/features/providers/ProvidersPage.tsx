import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Activity, Building2, CheckCircle2, RadioTower } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { RelativeTime } from "@/components/common/RelativeTime"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { useLiveVehicles, useProviders } from "@/data/hooks"
import type { Provider } from "@/data/types"
import { computeProviderStats, type ProviderStats } from "@/lib/provider-stats"
import { cn } from "@/lib/utils"

interface ProviderRow extends Provider {
  stats: ProviderStats
}

function OnlineBar({ stats }: { stats: ProviderStats }) {
  const healthy = stats.onlinePct >= 90
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            healthy ? "bg-emerald-500" : "bg-amber-500"
          )}
          style={{ width: `${stats.onlinePct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {stats.onlineCount}/{stats.deviceCount}
      </span>
    </div>
  )
}

export function ProvidersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const providers = useProviders().data ?? []
  const vehicles = useLiveVehicles()
  const [search, setSearch] = useState("")

  const rows = useMemo<ProviderRow[]>(
    () =>
      providers
        .map((p) => ({
          ...p,
          stats: computeProviderStats(p.code, vehicles),
        }))
        .filter((row) => {
          const q = search.trim().toLowerCase()
          if (!q) return true
          return row.code.toLowerCase().includes(q)
        })
        .sort((a, b) => b.stats.deviceCount - a.stats.deviceCount),
    [providers, vehicles, search]
  )

  const activeProviders = providers.filter((p) => p.active).length
  const totalDevices = vehicles.length
  const onlineDevices = vehicles.filter((v) => v.status !== "no_signal").length
  const onlinePct =
    totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0

  const columns: DataTableColumn<ProviderRow>[] = [
    {
      key: "code",
      header: t("providers.table.provider"),
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-medium">{row.code}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              #{row.id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: t("providers.table.status"),
      render: (row) => (
        <Badge variant={row.active ? "default" : "secondary"}>
          {row.active ? t("providers.active") : t("providers.inactive")}
        </Badge>
      ),
    },
    {
      key: "devices",
      header: t("providers.table.devices"),
      render: (row) => (
        <span className="text-sm font-medium tabular-nums">
          {row.stats.deviceCount}
        </span>
      ),
    },
    {
      key: "online",
      header: t("providers.table.transmitting"),
      render: (row) => <OnlineBar stats={row.stats} />,
    },
    {
      key: "lastSync",
      header: t("providers.table.lastSync"),
      render: (row) =>
        row.stats.lastSyncAt ? (
          <RelativeTime
            iso={row.stats.lastSyncAt}
            className="text-sm text-muted-foreground"
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "added",
      header: t("providers.table.added"),
      render: (row) => (
        <RelativeTime
          iso={row.createdAt}
          className="text-sm text-muted-foreground"
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t("providers.title")}
        description={t("providers.description")}
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("providers.stats.providers")}
            value={providers.length}
            icon={Building2}
            hint={t("providers.stats.providersHint")}
          />
          <StatCard
            label={t("providers.stats.activeProviders")}
            value={activeProviders}
            icon={CheckCircle2}
            intent="success"
            hint={t("providers.stats.activeProvidersHint")}
          />
          <StatCard
            label={t("providers.stats.devicesTransmitting")}
            value={onlineDevices}
            icon={RadioTower}
            intent="success"
            hint={t("providers.stats.devicesTransmittingHint", {
              count: totalDevices,
            })}
          />
          <StatCard
            label={t("providers.stats.fleetOnline")}
            value={`${onlinePct}%`}
            icon={Activity}
            intent={onlinePct >= 90 ? "success" : "warning"}
            hint={t("providers.stats.fleetOnlineHint")}
          />
        </div>

        <DataTable
          data={rows}
          columns={columns}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("providers.searchPlaceholder")}
          onRowClick={(row) => navigate(`/providers/${row.id}`)}
          emptyTitle={t("providers.emptyTitle")}
          emptyDescription={t("providers.emptyDescription")}
        />
      </div>
    </div>
  )
}
