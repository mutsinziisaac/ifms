import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle,
  FileDown,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import { CategoryBars } from "@/components/common/CategoryBars"
import { CategoryDonut } from "@/components/common/CategoryDonut"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { EntityBadge } from "@/components/common/EntityBadge"
import { StatCard } from "@/components/common/StatCard"
import { IncidentSeverityBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAccidents, useDeleteAccident, useEntities } from "@/data/hooks"
import type {
  AccidentRecord,
  IncidentRootCause,
  IncidentSeverity,
} from "@/data/types"
import { INCIDENT_ROOT_CAUSES, INCIDENT_SEVERITIES } from "@/data/types"
import { exportToCsv, exportToPdf, exportToXlsx } from "@/lib/export"
import { formatDate, formatDateTime, formatEtb } from "@/lib/format"
import {
  INCIDENT_ROOT_CAUSE_COLOR,
  INCIDENT_SEVERITY_CONFIG,
} from "@/lib/status"

import { IncidentFormDialog } from "./components/IncidentFormDialog"

export function IncidentsPage() {
  const { t } = useTranslation()
  const accidentsQuery = useAccidents()
  const entities = useEntities().data ?? []
  const deleteAccident = useDeleteAccident()

  const accidents = useMemo(() => accidentsQuery.data ?? [], [accidentsQuery.data])

  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | "all">(
    "all"
  )
  const [causeFilter, setCauseFilter] = useState<IncidentRootCause | "all">("all")
  const [entityFilter, setEntityFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AccidentRecord | null>(null)
  const [deleting, setDeleting] = useState<AccidentRecord | null>(null)

  const entityShortById = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of entities) map.set(e.id, e.shortName)
    return map
  }, [entities])

  const stats = useMemo(() => {
    let major = 0
    let casualties = 0
    let repair = 0
    let insurance = 0
    for (const a of accidents) {
      if (a.severity === "major") major++
      casualties += a.casualties
      repair += a.repairCostEtb
      insurance += a.insuranceClaimEtb
    }
    return { total: accidents.length, major, casualties, repair, insurance }
  }, [accidents])

  const severityData = useMemo(
    () =>
      INCIDENT_SEVERITIES.map((s) => ({
        key: s,
        label: t(`enums.incidentSeverity.${s}`),
        value: accidents.filter((a) => a.severity === s).length,
        color: INCIDENT_SEVERITY_CONFIG[s].color,
      })),
    [accidents, t]
  )

  const causeData = useMemo(
    () =>
      INCIDENT_ROOT_CAUSES.map((c) => ({
        key: c,
        label: t(`enums.incidentRootCause.${c}`),
        value: accidents.filter((a) => a.rootCause === c).length,
        color: INCIDENT_ROOT_CAUSE_COLOR[c],
      })),
    [accidents, t]
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return accidents.filter((a) => {
      if (needle) {
        const hay = `${a.vehiclePlate} ${a.policeReportNo}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      if (severityFilter !== "all" && a.severity !== severityFilter) return false
      if (causeFilter !== "all" && a.rootCause !== causeFilter) return false
      if (entityFilter !== "all" && a.entityId !== entityFilter) return false
      return true
    })
  }, [accidents, search, severityFilter, causeFilter, entityFilter])

  const columns: DataTableColumn<AccidentRecord>[] = [
    {
      key: "date",
      header: t("incidents.table.date"),
      render: (a) => <span className="text-sm">{formatDate(a.occurredAt)}</span>,
    },
    {
      key: "vehicle",
      header: t("incidents.table.vehicle"),
      render: (a) => (
        <div className="min-w-0">
          <p className="text-sm font-medium tabular-nums">{a.vehiclePlate}</p>
          <EntityBadge name={entityShortById.get(a.entityId) ?? "—"} />
        </div>
      ),
    },
    {
      key: "severity",
      header: t("incidents.table.severity"),
      render: (a) => <IncidentSeverityBadge severity={a.severity} />,
    },
    {
      key: "rootCause",
      header: t("incidents.table.rootCause"),
      render: (a) => (
        <span className="text-sm">
          {t(`enums.incidentRootCause.${a.rootCause}`)}
        </span>
      ),
    },
    {
      key: "casualties",
      header: t("incidents.table.casualties"),
      className: "text-right",
      render: (a) => (
        <span className="text-sm tabular-nums">{a.casualties}</span>
      ),
    },
    {
      key: "repairCost",
      header: t("incidents.table.repairCost"),
      className: "text-right",
      render: (a) => (
        <span className="text-sm tabular-nums">{formatEtb(a.repairCostEtb)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (a) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setEditing(a)
            }}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("incidents.actions.edit")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeleting(a)
            }}
          >
            <Trash2 className="size-4 text-rose-500" />
            <span className="sr-only">{t("incidents.actions.delete")}</span>
          </Button>
        </div>
      ),
    },
  ]

  function exportTable() {
    const columnsDef = [
      { header: t("incidents.table.date") },
      { header: t("incidents.table.vehicle") },
      { header: t("incidents.table.severity") },
      { header: t("incidents.table.rootCause") },
      { header: t("incidents.table.casualties") },
      { header: t("incidents.table.repairCost") },
      { header: t("incidents.stats.insurance") },
      { header: t("incidents.table.location") },
    ]
    const rows = filtered.map((a) => [
      formatDate(a.occurredAt),
      a.vehiclePlate,
      t(`enums.incidentSeverity.${a.severity}`),
      t(`enums.incidentRootCause.${a.rootCause}`),
      a.casualties,
      a.repairCostEtb,
      a.insuranceClaimEtb,
      a.address,
    ])
    return { columnsDef, rows }
  }

  function guard(): boolean {
    if (filtered.length === 0) {
      toast.error(t("incidents.toast.nothingToExport"))
      return false
    }
    return true
  }

  function handleCsv() {
    if (!guard()) return
    const { columnsDef, rows } = exportTable()
    exportToCsv("ifms-incidents.csv", columnsDef, rows)
    toast.success(t("incidents.toast.exported"))
  }
  function handleXlsx() {
    if (!guard()) return
    const { columnsDef, rows } = exportTable()
    exportToXlsx("ifms-incidents.xlsx", [
      { name: t("incidents.title"), columns: columnsDef, rows },
    ])
    toast.success(t("incidents.toast.exported"))
  }
  function handlePdf() {
    if (!guard()) return
    const { columnsDef, rows } = exportTable()
    exportToPdf({
      filename: "ifms-incidents.pdf",
      title: t("incidents.title"),
      subtitle: t("nav.brandSubtitle"),
      meta: [
        t("reports.export.generatedAt", {
          date: formatDateTime(new Date().toISOString()),
        }),
      ],
      columns: columnsDef,
      rows,
    })
    toast.success(t("incidents.toast.exported"))
  }

  function handleDelete() {
    if (!deleting) return
    deleteAccident.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("incidents.toast.deleted"))
        setDeleting(null)
      },
      onError: (err: unknown) =>
        toast.error(
          err instanceof Error ? err.message : t("incidents.toast.error")
        ),
    })
  }

  return (
    <div>
      <PageHeader
        title={t("incidents.title")}
        description={t("incidents.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleCsv}>
              <FileDown className="size-4" />
              {t("incidents.export.csv")}
            </Button>
            <Button variant="outline" onClick={handleXlsx}>
              <FileSpreadsheet className="size-4" />
              {t("incidents.export.excel")}
            </Button>
            <Button variant="outline" onClick={handlePdf}>
              <FileText className="size-4" />
              {t("incidents.export.pdf")}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {t("incidents.addButton")}
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("incidents.stats.total")}
            value={stats.total}
            icon={ShieldAlert}
            hint={t("incidents.stats.totalHint")}
          />
          <StatCard
            label={t("incidents.stats.major")}
            value={stats.major}
            icon={AlertTriangle}
            intent="danger"
            hint={t("incidents.stats.majorHint")}
          />
          <StatCard
            label={t("incidents.stats.casualties")}
            value={stats.casualties}
            icon={HeartPulse}
            intent="warning"
            hint={t("incidents.stats.casualtiesHint")}
          />
          <StatCard
            label={t("incidents.stats.repairCost")}
            value={formatEtb(stats.repair)}
            icon={Wrench}
            hint={`${t("incidents.stats.insurance")}: ${formatEtb(stats.insurance)}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="gap-0">
            <CardHeader>
              <CardTitle>{t("incidents.charts.severityTitle")}</CardTitle>
              <CardDescription>
                {t("incidents.charts.severitySubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryDonut
                data={severityData}
                centerLabel={t("incidents.charts.centerLabel")}
              />
            </CardContent>
          </Card>
          <Card className="gap-0">
            <CardHeader>
              <CardTitle>{t("incidents.charts.rootCauseTitle")}</CardTitle>
              <CardDescription>
                {t("incidents.charts.rootCauseSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBars
                data={causeData}
                valueLabel={t("incidents.charts.incidentsValueLabel")}
              />
            </CardContent>
          </Card>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          isLoading={accidentsQuery.isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={t("incidents.table.searchPlaceholder")}
          onRowClick={(a) => setEditing(a)}
          filters={[
            {
              key: "severity",
              label: t("incidents.filters.severity"),
              value: severityFilter,
              onChange: (v) => setSeverityFilter(v as IncidentSeverity | "all"),
              options: INCIDENT_SEVERITIES.map((s) => ({
                value: s,
                label: t(`enums.incidentSeverity.${s}`),
              })),
            },
            {
              key: "cause",
              label: t("incidents.filters.rootCause"),
              value: causeFilter,
              onChange: (v) => setCauseFilter(v as IncidentRootCause | "all"),
              options: INCIDENT_ROOT_CAUSES.map((c) => ({
                value: c,
                label: t(`enums.incidentRootCause.${c}`),
              })),
            },
            {
              key: "entity",
              label: t("incidents.filters.entity"),
              value: entityFilter,
              onChange: setEntityFilter,
              options: entities.map((e) => ({
                value: e.id,
                label: e.shortName,
              })),
            },
          ]}
          emptyTitle={t("incidents.table.emptyTitle")}
          emptyDescription={t("incidents.table.emptyDescription")}
        />
      </div>

      <IncidentFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <IncidentFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        record={editing ?? undefined}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("incidents.delete.title")}
        description={t("incidents.delete.description", {
          plate: deleting?.vehiclePlate ?? "",
        })}
        confirmLabel={t("incidents.delete.confirm")}
        destructive
        onConfirm={handleDelete}
        isPending={deleteAccident.isPending}
      />
    </div>
  )
}
