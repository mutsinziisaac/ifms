import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FileDown, FileSpreadsheet, FileText } from "lucide-react"
import { toast } from "sonner"

import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEntities, useEvents, useGeozones, useVehicles } from "@/data/hooks"
import { exportToCsv, exportToPdf, exportToXlsx } from "@/lib/export"
import { formatDateTime } from "@/lib/format"
import {
  buildReport,
  type ReportFilters,
  type ReportType,
} from "@/lib/report-data"

import { ReportSelectionPanel } from "./components/ReportSelectionPanel"

interface PreviewRow {
  id: string
  cells: (string | number)[]
}

export function ReportsPage() {
  const { t } = useTranslation()
  const events = useEvents().data ?? []
  const vehicles = useVehicles().data ?? []
  const geozones = useGeozones().data ?? []
  const entities = useEntities().data ?? []

  const [reportType, setReportType] = useState<ReportType>("events")
  const [selection, setSelection] = useState<string[]>([])
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  const entityShortById = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of entities) map.set(e.id, e.shortName)
    return map
  }, [entities])

  const selectionOptions = useMemo(
    () =>
      [...vehicles]
        .sort((a, b) =>
          a.plate.localeCompare(b.plate, undefined, { numeric: true })
        )
        .map((v) => ({
          value: v.id,
          label: v.plate,
          sub: `${entityShortById.get(v.entityId) ?? "—"} · ${t(`enums.vehicleType.${v.type}`)}`,
        })),
    [vehicles, entityShortById, t]
  )

  const filters: ReportFilters = useMemo(
    () => ({
      selection,
      fromDate: fromDate || null,
      toDate: toDate || null,
    }),
    [selection, fromDate, toDate]
  )

  const report = useMemo(
    () => buildReport(reportType, { events, vehicles, geozones }, filters),
    [reportType, events, vehicles, geozones, filters]
  )

  const previewRows: PreviewRow[] = useMemo(
    () => report.rows.map((cells, i) => ({ id: String(i), cells })),
    [report.rows]
  )

  const previewColumns: DataTableColumn<PreviewRow>[] = report.columns.map(
    (col, ci) => ({
      key: col.key ?? String(ci),
      header: col.header,
      render: (row) => (
        <span className="text-sm whitespace-nowrap">{row.cells[ci]}</span>
      ),
    })
  )

  function metaLines(): string[] {
    const lines = [
      t("reports.export.generatedAt", {
        date: formatDateTime(new Date().toISOString()),
      }),
    ]
    lines.push(
      selection.length === 0
        ? t("reports.export.baseVehiclesAll")
        : t("reports.export.baseVehicles", { count: selection.length })
    )
    lines.push(
      fromDate || toDate
        ? t("reports.export.dateRange", {
            from: fromDate || "…",
            to: toDate || "…",
          })
        : t("reports.export.dateRangeAll")
    )
    return lines
  }

  const reportTitle =
    reportType === "events" ? t("reports.type.events") : t("reports.type.geozones")
  const fileBase = `ifms-${reportType}-report`

  function guard(): boolean {
    if (report.rows.length === 0) {
      toast.error(t("reports.toast.nothingToExport"))
      return false
    }
    return true
  }

  function handlePdf() {
    if (!guard()) return
    exportToPdf({
      filename: `${fileBase}.pdf`,
      title: reportTitle,
      subtitle: t("nav.brandSubtitle"),
      meta: metaLines(),
      columns: report.columns,
      rows: report.rows,
    })
    toast.success(t("reports.toast.exported"))
  }

  function handleXlsx() {
    if (!guard()) return
    exportToXlsx(`${fileBase}.xlsx`, [
      {
        name:
          reportType === "events"
            ? t("reports.export.sheetEvents")
            : t("reports.export.sheetGeozones"),
        columns: report.columns,
        rows: report.rows,
      },
    ])
    toast.success(t("reports.toast.exported"))
  }

  function handleCsv() {
    if (!guard()) return
    exportToCsv(`${fileBase}.csv`, report.columns, report.rows)
    toast.success(t("reports.toast.exported"))
  }

  return (
    <div>
      <PageHeader
        title={t("reports.title")}
        description={t("reports.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleCsv}>
              <FileDown className="size-4" />
              {t("reports.export.csv")}
            </Button>
            <Button variant="outline" onClick={handleXlsx}>
              <FileSpreadsheet className="size-4" />
              {t("reports.export.excel")}
            </Button>
            <Button onClick={handlePdf}>
              <FileText className="size-4" />
              {t("reports.export.pdf")}
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <Card className="gap-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>{t("reports.type.label")}</Label>
              <Select
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="events">
                    {t("reports.type.events")}
                  </SelectItem>
                  <SelectItem value="geozones">
                    {t("reports.type.geozones")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-from">{t("reports.dateFrom")}</Label>
              <Input
                id="report-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-to">{t("reports.dateTo")}</Label>
              <Input
                id="report-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("reports.selection.title")}</Label>
            <ReportSelectionPanel
              options={selectionOptions}
              value={selection}
              onChange={setSelection}
              searchPlaceholder={t("reports.selection.searchVehicles")}
            />
          </div>
        </Card>

        <DataTable
          data={previewRows}
          columns={previewColumns}
          pageSize={12}
          emptyTitle={t("reports.preview.emptyTitle")}
          emptyDescription={t("reports.preview.emptyDescription")}
        />
      </div>
    </div>
  )
}
