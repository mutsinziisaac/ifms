import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Coins,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { CategoryBars } from "@/components/common/CategoryBars"
import { CategoryDonut } from "@/components/common/CategoryDonut"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { EntityBadge } from "@/components/common/EntityBadge"
import { StatCard } from "@/components/common/StatCard"
import { FineStatusBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEntities, useDeleteFine, useFines } from "@/data/hooks"
import type { Fine, FineStatus, ViolationType } from "@/data/types"
import { FINE_STATUSES, VIOLATION_TYPES } from "@/data/types"
import { exportToCsv, exportToPdf, exportToXlsx } from "@/lib/export"
import { formatDate, formatDateTime, formatEtb } from "@/lib/format"
import { FINE_STATUS_CONFIG, VIOLATION_TYPE_COLOR } from "@/lib/status"

import { FineFormDialog } from "./components/FineFormDialog"

export function FinesPage() {
  const { t } = useTranslation()
  const finesQuery = useFines()
  const entities = useEntities().data ?? []
  const deleteFine = useDeleteFine()

  const fines = useMemo(() => finesQuery.data ?? [], [finesQuery.data])

  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<ViolationType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<FineStatus | "all">("all")
  const [entityFilter, setEntityFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Fine | null>(null)
  const [deleting, setDeleting] = useState<Fine | null>(null)

  const entityShortById = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of entities) map.set(e.id, e.shortName)
    return map
  }, [entities])

  const stats = useMemo(() => {
    let totalCost = 0
    let paid = 0
    let outstanding = 0
    for (const f of fines) {
      totalCost += f.amountEtb
      if (f.status === "paid") paid++
      else outstanding++
    }
    return { total: fines.length, totalCost, paid, outstanding }
  }, [fines])

  const statusData = useMemo(
    () =>
      FINE_STATUSES.map((s) => ({
        key: s,
        label: t(`enums.fineStatus.${s}`),
        value: fines.filter((f) => f.status === s).length,
        color: FINE_STATUS_CONFIG[s].color,
      })),
    [fines, t]
  )

  const typeData = useMemo(
    () =>
      VIOLATION_TYPES.map((vt) => ({
        key: vt,
        label: t(`enums.violationType.${vt}`),
        value: fines
          .filter((f) => f.violationType === vt)
          .reduce((sum, f) => sum + f.amountEtb, 0),
        color: VIOLATION_TYPE_COLOR[vt],
      })),
    [fines, t]
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return fines.filter((f) => {
      if (needle) {
        const hay =
          `${f.ticketNo} ${f.vehiclePlate} ${f.driverName ?? ""}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      if (typeFilter !== "all" && f.violationType !== typeFilter) return false
      if (statusFilter !== "all" && f.status !== statusFilter) return false
      if (entityFilter !== "all" && f.entityId !== entityFilter) return false
      return true
    })
  }, [fines, search, typeFilter, statusFilter, entityFilter])

  const columns: DataTableColumn<Fine>[] = [
    {
      key: "ticket",
      header: t("fines.table.ticket"),
      render: (f) => (
        <span className="text-sm font-medium tabular-nums">{f.ticketNo}</span>
      ),
    },
    {
      key: "date",
      header: t("fines.table.date"),
      render: (f) => <span className="text-sm">{formatDate(f.issuedAt)}</span>,
    },
    {
      key: "vehicle",
      header: t("fines.table.vehicle"),
      render: (f) => (
        <div className="min-w-0">
          <p className="text-sm font-medium tabular-nums">{f.vehiclePlate}</p>
          <EntityBadge name={entityShortById.get(f.entityId) ?? "—"} />
        </div>
      ),
    },
    {
      key: "driver",
      header: t("fines.table.driver"),
      render: (f) => <span className="text-sm">{f.driverName ?? "—"}</span>,
    },
    {
      key: "type",
      header: t("fines.table.type"),
      render: (f) => (
        <span className="text-sm">
          {t(`enums.violationType.${f.violationType}`)}
        </span>
      ),
    },
    {
      key: "amount",
      header: t("fines.table.amount"),
      className: "text-right",
      render: (f) => (
        <span className="text-sm tabular-nums">{formatEtb(f.amountEtb)}</span>
      ),
    },
    {
      key: "status",
      header: t("fines.table.status"),
      render: (f) => <FineStatusBadge status={f.status} />,
    },
    {
      key: "source",
      header: t("fines.table.source"),
      render: (f) =>
        f.eventId ? (
          <Link
            to={`/events?vehicle=${f.vehicleId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            {t("fines.table.sourceEvent")}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (f) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setEditing(f)
            }}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("fines.actions.edit")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeleting(f)
            }}
          >
            <Trash2 className="size-4 text-rose-500" />
            <span className="sr-only">{t("fines.actions.delete")}</span>
          </Button>
        </div>
      ),
    },
  ]

  function exportTable() {
    const columnsDef = [
      { header: t("fines.table.ticket") },
      { header: t("fines.table.date") },
      { header: t("fines.table.vehicle") },
      { header: t("fines.table.driver") },
      { header: t("fines.table.type") },
      { header: t("fines.table.amount") },
      { header: t("fines.table.status") },
    ]
    const rows = filtered.map((f) => [
      f.ticketNo,
      formatDate(f.issuedAt),
      f.vehiclePlate,
      f.driverName ?? "—",
      t(`enums.violationType.${f.violationType}`),
      f.amountEtb,
      t(`enums.fineStatus.${f.status}`),
    ])
    return { columnsDef, rows }
  }

  function guard(): boolean {
    if (filtered.length === 0) {
      toast.error(t("fines.toast.nothingToExport"))
      return false
    }
    return true
  }

  function handleCsv() {
    if (!guard()) return
    const { columnsDef, rows } = exportTable()
    exportToCsv("ifms-fines.csv", columnsDef, rows)
    toast.success(t("fines.toast.exported"))
  }
  function handleXlsx() {
    if (!guard()) return
    const { columnsDef, rows } = exportTable()
    exportToXlsx("ifms-fines.xlsx", [
      { name: t("fines.title"), columns: columnsDef, rows },
    ])
    toast.success(t("fines.toast.exported"))
  }
  function handlePdf() {
    if (!guard()) return
    const { columnsDef, rows } = exportTable()
    exportToPdf({
      filename: "ifms-fines.pdf",
      title: t("fines.title"),
      subtitle: t("nav.brandSubtitle"),
      meta: [
        t("reports.export.generatedAt", {
          date: formatDateTime(new Date().toISOString()),
        }),
      ],
      columns: columnsDef,
      rows,
    })
    toast.success(t("fines.toast.exported"))
  }

  function handleDelete() {
    if (!deleting) return
    deleteFine.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("fines.toast.deleted"))
        setDeleting(null)
      },
      onError: (err: unknown) =>
        toast.error(err instanceof Error ? err.message : t("fines.toast.error")),
    })
  }

  return (
    <div>
      <PageHeader
        title={t("fines.title")}
        description={t("fines.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleCsv}>
              <FileDown className="size-4" />
              {t("fines.export.csv")}
            </Button>
            <Button variant="outline" onClick={handleXlsx}>
              <FileSpreadsheet className="size-4" />
              {t("fines.export.excel")}
            </Button>
            <Button variant="outline" onClick={handlePdf}>
              <FileText className="size-4" />
              {t("fines.export.pdf")}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t("fines.addButton")}
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("fines.stats.total")}
            value={stats.total}
            icon={ReceiptText}
            hint={t("fines.stats.totalHint")}
          />
          <StatCard
            label={t("fines.stats.totalCost")}
            value={formatEtb(stats.totalCost)}
            icon={Coins}
            hint={t("fines.stats.totalCostHint")}
          />
          <StatCard
            label={t("fines.stats.outstanding")}
            value={stats.outstanding}
            icon={Wallet}
            intent="warning"
            hint={t("fines.stats.outstandingHint")}
          />
          <StatCard
            label={t("fines.stats.paid")}
            value={stats.paid}
            icon={Coins}
            intent="success"
            hint={t("fines.stats.paidHint", {
              count: stats.paid,
              total: stats.total,
            })}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="gap-0">
            <CardHeader>
              <CardTitle>{t("fines.charts.statusTitle")}</CardTitle>
              <CardDescription>
                {t("fines.charts.statusSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryDonut
                data={statusData}
                centerLabel={t("fines.charts.centerLabel")}
              />
            </CardContent>
          </Card>
          <Card className="gap-0">
            <CardHeader>
              <CardTitle>{t("fines.charts.typeTitle")}</CardTitle>
              <CardDescription>{t("fines.charts.typeSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBars
                data={typeData}
                valueLabel={t("fines.charts.typeValueLabel")}
              />
            </CardContent>
          </Card>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          isLoading={finesQuery.isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("fines.table.searchPlaceholder")}
          onRowClick={(f) => setEditing(f)}
          filters={[
            {
              key: "type",
              label: t("fines.filters.type"),
              value: typeFilter,
              onChange: (v) => setTypeFilter(v as ViolationType | "all"),
              options: VIOLATION_TYPES.map((vt) => ({
                value: vt,
                label: t(`enums.violationType.${vt}`),
              })),
            },
            {
              key: "status",
              label: t("fines.filters.status"),
              value: statusFilter,
              onChange: (v) => setStatusFilter(v as FineStatus | "all"),
              options: FINE_STATUSES.map((s) => ({
                value: s,
                label: t(`enums.fineStatus.${s}`),
              })),
            },
            {
              key: "entity",
              label: t("fines.filters.entity"),
              value: entityFilter,
              onChange: setEntityFilter,
              options: entities.map((e) => ({
                value: e.id,
                label: e.shortName,
              })),
            },
          ]}
          emptyTitle={t("fines.table.emptyTitle")}
          emptyDescription={t("fines.table.emptyDescription")}
        />
      </div>

      <FineFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <FineFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        fine={editing ?? undefined}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("fines.delete.title")}
        description={t("fines.delete.description", {
          ticket: deleting?.ticketNo ?? "",
        })}
        confirmLabel={t("fines.delete.confirm")}
        destructive
        onConfirm={handleDelete}
        isPending={deleteFine.isPending}
      />
    </div>
  )
}
