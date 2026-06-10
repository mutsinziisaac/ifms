import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Activity, Building2, MessagesSquare, RadioTower } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { RelativeTime } from "@/components/common/RelativeTime"
import { Sparkline } from "@/components/common/Sparkline"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/layout/PageHeader"
import {
  useEntities,
  useLiveProviderTelemetry,
  useLiveVehicles,
} from "@/data/hooks"
import type { Entity } from "@/data/types"
import { computeProviderStats, type ProviderStats } from "@/lib/provider-stats"
import { cn } from "@/lib/utils"

import { ProviderCategoryBadge } from "./components/ProviderCategoryBadge"

interface ProviderRow extends Entity {
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
  const navigate = useNavigate()
  const entities = useEntities().data ?? []
  const vehicles = useLiveVehicles()
  const telemetry = useLiveProviderTelemetry()
  const [search, setSearch] = useState("")

  const rows = useMemo<ProviderRow[]>(
    () =>
      entities
        .map((e) => ({
          ...e,
          stats: computeProviderStats(e, vehicles, telemetry),
        }))
        .filter((row) => {
          const q = search.trim().toLowerCase()
          if (!q) return true
          return (
            row.name.toLowerCase().includes(q) ||
            row.shortName.toLowerCase().includes(q) ||
            row.region.toLowerCase().includes(q)
          )
        })
        .sort((a, b) => b.stats.deviceCount - a.stats.deviceCount),
    [entities, vehicles, telemetry, search]
  )

  const totalDevices = vehicles.length
  const onlineDevices = vehicles.filter((v) => v.status !== "no_signal").length
  const onlinePct =
    totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0
  const messagesTotal = telemetry.reduce((sum, t) => sum + t.messagesTotal, 0)

  const columns: DataTableColumn<ProviderRow>[] = [
    {
      key: "name",
      header: "Provider",
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.shortName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Type",
      render: (row) => <ProviderCategoryBadge category={row.category} />,
    },
    {
      key: "region",
      header: "Region",
      render: (row) => <span className="text-sm">{row.region}</span>,
    },
    {
      key: "devices",
      header: "Devices",
      render: (row) => (
        <span className="text-sm font-medium tabular-nums">
          {row.stats.deviceCount}
        </span>
      ),
    },
    {
      key: "online",
      header: "Transmitting",
      render: (row) => <OnlineBar stats={row.stats} />,
    },
    {
      key: "lastSync",
      header: "Last sync",
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
      key: "messages",
      header: "Messages",
      render: (row) => (
        <span className="text-sm tabular-nums">
          {row.stats.messagesTotal.toLocaleString()}
        </span>
      ),
    },
    {
      key: "trend",
      header: "Activity",
      render: (row) => (
        <div className="h-8 w-24 text-primary">
          <Sparkline data={row.stats.history} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Providers"
        description="Government ministries and institutions transmitting device data to the MoTL platform."
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Providers"
            value={entities.length}
            icon={Building2}
            hint="Ministries, agencies & enterprises"
          />
          <StatCard
            label="Devices transmitting"
            value={onlineDevices}
            icon={RadioTower}
            intent="success"
            hint={`of ${totalDevices} registered devices`}
          />
          <StatCard
            label="Fleet online"
            value={`${onlinePct}%`}
            icon={Activity}
            intent={onlinePct >= 90 ? "success" : "warning"}
            hint="Devices with an active signal"
          />
          <StatCard
            label="Messages received"
            value={messagesTotal.toLocaleString()}
            icon={MessagesSquare}
            hint="Position reports this session"
          />
        </div>

        <DataTable
          data={rows}
          columns={columns}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search providers…"
          onRowClick={(row) => navigate(`/providers/${row.id}`)}
          emptyTitle="No providers found"
          emptyDescription="Try a different search."
        />
      </div>
    </div>
  )
}
