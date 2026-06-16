import { useTranslation } from "react-i18next"

import { EntityBadge } from "@/components/common/EntityBadge"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { RelativeTime } from "@/components/common/RelativeTime"
import {
  EventSeverityBadge,
  EventStatusBadge,
} from "@/components/common/status-badges"
import type { Entity, FleetEvent } from "@/data/types"
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
  const { t } = useTranslation()
  const entityShortName = new Map(entities.map((e) => [e.id, e.shortName]))

  const columns: DataTableColumn<FleetEvent>[] = [
    {
      key: "severity",
      header: t("events.table.severity"),
      render: (e) => <EventSeverityBadge severity={e.severity} />,
    },
    {
      key: "status",
      header: t("events.table.status"),
      render: (e) => <EventStatusBadge status={e.status} />,
    },
    {
      key: "event",
      header: t("events.table.event"),
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
            {t(`enums.eventType.${e.type}`)}
          </p>
        </div>
      ),
    },
    {
      key: "provider",
      header: t("events.table.provider"),
      render: (e) => (
        <EntityBadge name={entityShortName.get(e.entityId) ?? "—"} />
      ),
    },
    {
      key: "vehicle",
      header: t("events.table.vehicle"),
      render: (e) => (
        <span className="font-mono text-xs tabular-nums">{e.vehiclePlate}</span>
      ),
    },
    {
      key: "geozone",
      header: t("events.table.geozone"),
      render: (e) => (
        <span className="text-sm text-muted-foreground">
          {e.geozoneName ?? "—"}
        </span>
      ),
    },
    {
      key: "when",
      header: t("events.table.when"),
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
      searchPlaceholder={t("events.table.searchPlaceholder")}
      toolbarActions={toolbarActions}
      onRowClick={onSelect}
      pageSize={12}
      emptyTitle={t("events.table.emptyTitle")}
      emptyDescription={t("events.table.emptyDescription")}
    />
  )
}
