import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import {
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CircleDot,
  Download,
  Eye,
  List,
  Map as MapIcon,
  TriangleAlert,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { isRealApi } from "@/data/api"
import {
  useAlertCounts,
  useAlertsFeed,
  useEntities,
  useMarkAllEventsRead,
  useVehicles,
} from "@/data/hooks"
import { ALERT_STATUSES, ALERT_TYPES } from "@/data/types"
import type { AlertStatus, AlertType, FleetEvent } from "@/data/types"

import { EventDetailSheet } from "./components/EventDetailSheet"
import { EventsMapView } from "./components/EventsMapView"
import { EventsTable } from "./components/EventsTable"
import { exportEventsCsv } from "./components/events-export"

type ViewMode = "list" | "map"

const SEVERITIES = ["info", "warning", "critical"] as const

// Server page size. Matches EventsTable's DataTable pageSize so the table's own
// (client) pager stays dormant — one loaded page never exceeds it — and the
// server pager below drives page-number instead.
const PAGE_SIZE = 12

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  allLabel: string
  options: { value: string; label: string }[]
  width?: string
}

function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
  width = "w-[150px]",
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className={width}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function EventsPage() {
  const { t } = useTranslation()

  // Deep links: /events?entity=…&vehicle=… preselect those filters.
  const [searchParams] = useSearchParams()
  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  // status + alertType drive the backend query (server-side filtering).
  const [status, setStatus] = useState<string>("all")
  const [alertType, setAlertType] = useState<string>("all")
  // severity / provider / vehicle / search filter the loaded page client-side.
  const [severity, setSeverity] = useState("all")
  const [entity, setEntity] = useState(searchParams.get("entity") ?? "all")
  const [vehicle, setVehicle] = useState(searchParams.get("vehicle") ?? "all")
  const [pageNumber, setPageNumber] = useState(1)

  const feed = useAlertsFeed({
    status: status === "all" ? undefined : (status as AlertStatus),
    alertType: alertType === "all" ? undefined : (alertType as AlertType),
    pageNumber,
    pageSize: PAGE_SIZE,
  })
  const events = feed.events
  const counts = useAlertCounts()
  const entities = useEntities().data ?? []
  const vehicles = useVehicles().data ?? []
  const markAllRead = useMarkAllEventsRead()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Changing a server-side filter resets to the first page.
  const handleStatusChange = (value: string) => {
    setStatus(value)
    setPageNumber(1)
  }
  const handleTypeChange = (value: string) => {
    setAlertType(value)
    setPageNumber(1)
  }

  // The backend already filtered by status + alert_type; apply the remaining
  // facets to the loaded page in-browser.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return events.filter(
      (e) =>
        (severity === "all" || e.severity === severity) &&
        (entity === "all" || e.entityId === entity) &&
        (vehicle === "all" || e.vehicleId === vehicle) &&
        (q === "" ||
          e.message.toLowerCase().includes(q) ||
          e.vehiclePlate.toLowerCase().includes(q))
    )
  }, [events, severity, entity, vehicle, search])

  // Resolve from the loaded page so workflow changes reflect immediately.
  const selectedEvent = events.find((e) => e.id === selectedId) ?? null

  // Banner reflects the loaded page — severity isn't a server-side facet, so an
  // exact corridor-wide count isn't available without an extra query.
  const openCriticalCount = events.filter(
    (e) => e.status === "open" && e.severity === "critical"
  ).length

  const totalPages = feed.pagination?.total_pages ?? 1
  const totalRecords = feed.pagination?.total_records ?? events.length
  const rangeFrom = totalRecords === 0 ? 0 : (pageNumber - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(pageNumber * PAGE_SIZE, totalRecords)

  const handleSelect = (event: FleetEvent) => {
    setSelectedId(event.id)
    setSheetOpen(true)
  }

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.info(t("events.toast.nothingToExport"))
      return
    }
    exportEventsCsv(filtered, entities)
    toast.success(t("events.toast.exported", { count: filtered.length }))
  }

  const filterBar = (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        value={status}
        onChange={handleStatusChange}
        allLabel={t("events.filters.allStatuses")}
        options={ALERT_STATUSES.map((s) => ({
          value: s,
          label: t(`enums.alertStatus.${s}`),
        }))}
      />
      <FilterSelect
        value={alertType}
        onChange={handleTypeChange}
        allLabel={t("events.filters.allTypes")}
        options={ALERT_TYPES.map((tp) => ({
          value: tp,
          label: t(`enums.alertType.${tp}`),
        }))}
      />
      <FilterSelect
        value={severity}
        onChange={setSeverity}
        allLabel={t("events.filters.allSeverities")}
        options={SEVERITIES.map((s) => ({
          value: s,
          label: t(`enums.eventSeverity.${s}`),
        }))}
      />
      <FilterSelect
        value={entity}
        onChange={setEntity}
        allLabel={t("events.filters.allProviders")}
        width="w-[170px]"
        options={entities.map((e) => ({ value: e.id, label: e.shortName }))}
      />
      <FilterSelect
        value={vehicle}
        onChange={setVehicle}
        allLabel={t("events.filters.allVehicles")}
        options={vehicles.map((v) => ({ value: v.id, label: v.plate }))}
      />
    </div>
  )

  return (
    <div>
      <PageHeader
        title={t("events.title")}
        description={t("events.description")}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              {t("common.exportCsv")}
            </Button>
            <ToggleGroup
              type="single"
              variant="outline"
              value={view}
              onValueChange={(value) => {
                if (value) setView(value as ViewMode)
              }}
            >
              <ToggleGroupItem
                value="list"
                aria-label={t("events.view.listLabel")}
              >
                <List className="size-4" />
                {t("common.viewList")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="map"
                aria-label={t("events.view.mapLabel")}
              >
                <MapIcon className="size-4" />
                {t("common.viewMap")}
              </ToggleGroupItem>
            </ToggleGroup>
          </>
        }
      />

      <div className="space-y-4">
        {openCriticalCount > 0 && !bannerDismissed && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-700 dark:text-rose-300">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
            </span>
            <TriangleAlert className="size-4 shrink-0" />
            <p className="flex-1 text-sm font-medium">
              {t("events.alertBanner.message", { count: openCriticalCount })}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-500/40 bg-transparent text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
              onClick={() => {
                setSeverity("critical")
                handleStatusChange("OPEN")
                setView("list")
              }}
            >
              {t("events.alertBanner.action")}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
              aria-label={t("events.alertBanner.dismiss")}
              onClick={() => setBannerDismissed(true)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("events.stats.open")}
            value={counts.open}
            icon={CircleDot}
            intent={counts.open > 0 ? "danger" : "default"}
            hint={t("events.stats.openHint")}
          />
          <StatCard
            label={t("events.stats.acknowledged")}
            value={counts.acknowledged}
            icon={Eye}
            intent="warning"
            hint={t("events.stats.acknowledgedHint")}
          />
          <StatCard
            label={t("events.stats.resolved")}
            value={counts.resolved}
            icon={CircleCheckBig}
            intent="success"
            hint={t("events.stats.resolvedHint")}
          />
          <StatCard
            label={t("events.stats.total")}
            value={counts.total}
            icon={Bell}
            hint={t("events.stats.totalHint")}
          />
        </div>

        {filterBar}

        {view === "list" ? (
          <div className="space-y-4">
            <EventsTable
              events={filtered}
              entities={entities}
              searchValue={search}
              onSearchChange={setSearch}
              toolbarActions={
                isRealApi ? undefined : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      markAllRead.mutate(undefined, {
                        onSuccess: () =>
                          toast.success(t("events.toast.allMarkedRead")),
                      })
                    }
                  >
                    <CheckCheck className="size-4" />
                    {t("common.markAllRead")}
                  </Button>
                )
              }
              onSelect={handleSelect}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {t("common.table.showingRange", {
                    from: rangeFrom,
                    to: rangeTo,
                    total: totalRecords,
                  })}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                  >
                    <ChevronLeft />
                    <span className="sr-only">
                      {t("common.table.previousPage")}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      setPageNumber((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={pageNumber >= totalPages}
                  >
                    <ChevronRight />
                    <span className="sr-only">{t("common.table.nextPage")}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EventsMapView
            events={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        )}
      </div>

      <EventDetailSheet
        event={selectedEvent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
