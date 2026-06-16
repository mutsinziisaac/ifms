import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import {
  CheckCheck,
  CircleCheckBig,
  CircleDot,
  Download,
  Eye,
  List,
  Map as MapIcon,
  TriangleAlert,
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
import {
  useEntities,
  useLiveEvents,
  useMarkAllEventsRead,
  useVehicles,
} from "@/data/hooks"
import { EVENT_STATUSES, EVENT_TYPES } from "@/data/types"
import type { FleetEvent } from "@/data/types"

import { EventDetailSheet } from "./components/EventDetailSheet"
import { EventsMapView } from "./components/EventsMapView"
import { EventsTable } from "./components/EventsTable"
import { exportEventsCsv } from "./components/events-export"

type ViewMode = "list" | "map"

const SEVERITIES = ["info", "warning", "critical"] as const

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
  const events = useLiveEvents()
  const entities = useEntities().data ?? []
  const vehicles = useVehicles().data ?? []
  const markAllRead = useMarkAllEventsRead()

  // Deep links: /events?entity=…&vehicle=… preselect those filters.
  const [searchParams] = useSearchParams()
  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [severity, setSeverity] = useState("all")
  const [type, setType] = useState("all")
  const [entity, setEntity] = useState(searchParams.get("entity") ?? "all")
  const [vehicle, setVehicle] = useState(searchParams.get("vehicle") ?? "all")

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return events.filter(
      (e) =>
        (status === "all" || e.status === status) &&
        (severity === "all" || e.severity === severity) &&
        (type === "all" || e.type === type) &&
        (entity === "all" || e.entityId === entity) &&
        (vehicle === "all" || e.vehicleId === vehicle) &&
        (q === "" ||
          e.message.toLowerCase().includes(q) ||
          e.vehiclePlate.toLowerCase().includes(q))
    )
  }, [events, status, severity, type, entity, vehicle, search])

  // Resolve from the live list so workflow changes reflect immediately.
  const selectedEvent = events.find((e) => e.id === selectedId) ?? null

  const openCount = events.filter((e) => e.status === "open").length
  const ackCount = events.filter((e) => e.status === "acknowledged").length
  const escalatedCount = events.filter((e) => e.status === "escalated").length
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const closedToday = events.filter(
    (e) =>
      e.status === "closed" &&
      e.closedAt !== null &&
      new Date(e.closedAt).getTime() >= dayAgo
  ).length

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
        onChange={setStatus}
        allLabel={t("events.filters.allStatuses")}
        options={EVENT_STATUSES.map((s) => ({
          value: s,
          label: t(`enums.eventStatus.${s}`),
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
        value={type}
        onChange={setType}
        allLabel={t("events.filters.allTypes")}
        options={EVENT_TYPES.map((tp) => ({
          value: tp,
          label: t(`enums.eventType.${tp}`),
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("events.stats.open")}
            value={openCount}
            icon={CircleDot}
            intent={openCount > 0 ? "danger" : "default"}
            hint={t("events.stats.openHint")}
          />
          <StatCard
            label={t("events.stats.acknowledged")}
            value={ackCount}
            icon={Eye}
            intent="warning"
            hint={t("events.stats.acknowledgedHint")}
          />
          <StatCard
            label={t("events.stats.escalated")}
            value={escalatedCount}
            icon={TriangleAlert}
            intent={escalatedCount > 0 ? "warning" : "default"}
            hint={t("events.stats.escalatedHint")}
          />
          <StatCard
            label={t("events.stats.closedToday")}
            value={closedToday}
            icon={CircleCheckBig}
            intent="success"
            hint={t("events.stats.closedTodayHint")}
          />
        </div>

        {filterBar}

        {view === "list" ? (
          <EventsTable
            events={filtered}
            entities={entities}
            searchValue={search}
            onSearchChange={setSearch}
            toolbarActions={
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
            }
            onSelect={handleSelect}
          />
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
