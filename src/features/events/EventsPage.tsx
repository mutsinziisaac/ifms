import { useMemo, useState } from "react"
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
import {
  EVENT_SEVERITY_CONFIG,
  EVENT_STATUS_CONFIG,
  EVENT_TYPE_LABEL,
} from "@/lib/status"

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
      toast.info("No events to export")
      return
    }
    exportEventsCsv(filtered, entities)
    toast.success(`Exported ${filtered.length} events`)
  }

  const filterBar = (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        value={status}
        onChange={setStatus}
        allLabel="All statuses"
        options={EVENT_STATUSES.map((s) => ({
          value: s,
          label: EVENT_STATUS_CONFIG[s].label,
        }))}
      />
      <FilterSelect
        value={severity}
        onChange={setSeverity}
        allLabel="All severities"
        options={SEVERITIES.map((s) => ({
          value: s,
          label: EVENT_SEVERITY_CONFIG[s].label,
        }))}
      />
      <FilterSelect
        value={type}
        onChange={setType}
        allLabel="All types"
        options={EVENT_TYPES.map((t) => ({
          value: t,
          label: EVENT_TYPE_LABEL[t],
        }))}
      />
      <FilterSelect
        value={entity}
        onChange={setEntity}
        allLabel="All providers"
        width="w-[170px]"
        options={entities.map((e) => ({ value: e.id, label: e.shortName }))}
      />
      <FilterSelect
        value={vehicle}
        onChange={setVehicle}
        allLabel="All vehicles"
        options={vehicles.map((v) => ({ value: v.id, label: v.plate }))}
      />
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Events"
        description="Violation and activity events across the monitored fleet — review, escalate and close."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <ToggleGroup
              type="single"
              variant="outline"
              value={view}
              onValueChange={(value) => {
                if (value) setView(value as ViewMode)
              }}
            >
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="size-4" />
                List
              </ToggleGroupItem>
              <ToggleGroupItem value="map" aria-label="Map view">
                <MapIcon className="size-4" />
                Map
              </ToggleGroupItem>
            </ToggleGroup>
          </>
        }
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Open"
            value={openCount}
            icon={CircleDot}
            intent={openCount > 0 ? "danger" : "default"}
            hint="Awaiting review"
          />
          <StatCard
            label="Acknowledged"
            value={ackCount}
            icon={Eye}
            intent="warning"
            hint="Under review"
          />
          <StatCard
            label="Escalated"
            value={escalatedCount}
            icon={TriangleAlert}
            intent={escalatedCount > 0 ? "warning" : "default"}
            hint="With a higher authority"
          />
          <StatCard
            label="Closed today"
            value={closedToday}
            icon={CircleCheckBig}
            intent="success"
            hint="Resolved in the last 24h"
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
                    onSuccess: () => toast.success("All events marked read"),
                  })
                }
              >
                <CheckCheck className="size-4" />
                Mark all read
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
