import { EntityBadge } from "@/components/common/EntityBadge"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { RelativeTime } from "@/components/common/RelativeTime"
import {
  EventSeverityBadge,
  EventStatusBadge,
} from "@/components/common/status-badges"
import type { Entity, FleetEvent } from "@/data/types"
import { EVENT_TYPE_LABEL } from "@/lib/status"
import { cn } from "@/lib/utils"

export interface EventsTableProps {
  events: FleetEvent[]
  entities: Entity[]
  searchValue: string
  onSearchChange: (value: string) => void
  toolbarActions?: React.ReactNode
  onSelect: (event: FleetEvent) => void
}

export function EventsTable({
  events,
  entities,
  searchValue,
  onSearchChange,
  toolbarActions,
  onSelect,
}: EventsTableProps) {
  const entityShortName = new Map(entities.map((e) => [e.id, e.shortName]))

  const columns: DataTableColumn<FleetEvent>[] = [
    {
      key: "severity",
      header: "Severity",
      render: (e) => <EventSeverityBadge severity={e.severity} />,
    },
    {
      key: "status",
      header: "Status",
      render: (e) => <EventStatusBadge status={e.status} />,
    },
    {
      key: "event",
      header: "Event",
      className: "max-w-[360px]",
      render: (e) => (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm leading-snug",
              !e.read && "font-medium"
            )}
          >
            {!e.read ? (
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
            ) : null}
            {e.message}
          </p>
          <p className="text-xs text-muted-foreground">
            {EVENT_TYPE_LABEL[e.type]}
          </p>
        </div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (e) => (
        <EntityBadge name={entityShortName.get(e.entityId) ?? "—"} />
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (e) => (
        <span className="font-mono text-xs tabular-nums">{e.vehiclePlate}</span>
      ),
    },
    {
      key: "geozone",
      header: "Geozone",
      render: (e) => (
        <span className="text-sm text-muted-foreground">
          {e.geozoneName ?? "—"}
        </span>
      ),
    },
    {
      key: "when",
      header: "When",
      render: (e) => (
        <RelativeTime iso={e.at} className="text-sm text-muted-foreground" />
      ),
    },
  ]

  return (
    <DataTable
      data={events}
      columns={columns}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search events…"
      toolbarActions={toolbarActions}
      onRowClick={onSelect}
      pageSize={12}
      emptyTitle="No events match"
      emptyDescription="Adjust the filters or wait for the live feed."
    />
  )
}
