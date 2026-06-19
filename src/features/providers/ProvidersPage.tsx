import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Building2, CheckCircle2, Clock3, Truck } from "lucide-react"

import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { useProviders } from "@/data/hooks"
import type { Provider } from "@/data/types"
import { cn } from "@/lib/utils"

type CountIntent = "verified" | "unverified" | "notFound"

// A verification tally cell: muted when zero, otherwise coloured by intent.
function Count({ value, intent }: { value: number; intent?: CountIntent }) {
  return (
    <span
      className={cn(
        "text-sm font-medium tabular-nums",
        value === 0 && "text-muted-foreground",
        value > 0 && intent === "verified" && "text-emerald-600 dark:text-emerald-400",
        value > 0 && intent === "unverified" && "text-amber-600 dark:text-amber-400",
        value > 0 && intent === "notFound" && "text-red-600 dark:text-red-400"
      )}
    >
      {value}
    </span>
  )
}

export function ProvidersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const providers = useProviders().data ?? []
  const [search, setSearch] = useState("")

  const rows = useMemo<Provider[]>(
    () =>
      providers
        .filter((row) => {
          const q = search.trim().toLowerCase()
          if (!q) return true
          return (
            row.name.toLowerCase().includes(q) ||
            row.code.toLowerCase().includes(q)
          )
        })
        .sort(
          (a, b) => b.vehicleStats.submitted - a.vehicleStats.submitted
        ),
    [providers, search]
  )

  const activeProviders = providers.filter((p) => p.active).length
  const totals = useMemo(
    () =>
      providers.reduce(
        (acc, p) => {
          acc.submitted += p.vehicleStats.submitted
          acc.verified += p.vehicleStats.verified
          acc.unverified += p.vehicleStats.unverified
          acc.notFound += p.vehicleStats.notFound
          return acc
        },
        { submitted: 0, verified: 0, unverified: 0, notFound: 0 }
      ),
    [providers]
  )

  const columns: DataTableColumn<Provider>[] = [
    {
      key: "code",
      header: t("providers.table.provider"),
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground tabular-nums">
              {row.name === row.code ? `#${row.id}` : row.code}
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
      key: "submitted",
      header: t("providers.table.vehicles"),
      render: (row) => (
        <span className="text-sm font-medium tabular-nums">
          {row.vehicleStats.submitted}
        </span>
      ),
    },
    {
      key: "verified",
      header: t("providers.table.verified"),
      render: (row) => (
        <Count value={row.vehicleStats.verified} intent="verified" />
      ),
    },
    {
      key: "unverified",
      header: t("providers.table.unverified"),
      render: (row) => (
        <Count value={row.vehicleStats.unverified} intent="unverified" />
      ),
    },
    {
      key: "notFound",
      header: t("providers.table.notFound"),
      render: (row) => (
        <Count value={row.vehicleStats.notFound} intent="notFound" />
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
            label={t("providers.stats.vehiclesSubmitted")}
            value={totals.submitted}
            icon={Truck}
            hint={t("providers.stats.vehiclesSubmittedHint", {
              count: totals.verified,
            })}
          />
          <StatCard
            label={t("providers.stats.unverified")}
            value={totals.unverified}
            icon={Clock3}
            intent={totals.unverified > 0 ? "warning" : "success"}
            hint={t("providers.stats.unverifiedHint", {
              count: totals.notFound,
            })}
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
