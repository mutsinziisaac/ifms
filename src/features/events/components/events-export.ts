import type { Entity, FleetEvent } from "@/data/types"
import { downloadTextFile, toCsv } from "@/lib/csv"
import { formatDateTime } from "@/lib/format"
import {
  EVENT_SEVERITY_CONFIG,
  EVENT_STATUS_CONFIG,
  EVENT_TYPE_LABEL,
} from "@/lib/status"

/** Demo-grade event report: the filtered set with full workflow columns. */
export function exportEventsCsv(
  events: FleetEvent[],
  entities: Entity[]
): void {
  const entityName = new Map(entities.map((e) => [e.id, e.name]))
  const rows = events.map((e) => [
    formatDateTime(e.at),
    EVENT_SEVERITY_CONFIG[e.severity].label,
    EVENT_TYPE_LABEL[e.type],
    EVENT_STATUS_CONFIG[e.status].label,
    e.message,
    e.vehiclePlate,
    entityName.get(e.entityId) ?? "",
    e.geozoneName ?? "",
    e.acknowledgedBy ?? "",
    e.acknowledgedAt ? formatDateTime(e.acknowledgedAt) : "",
    e.escalatedTo ?? "",
    e.escalatedAt ? formatDateTime(e.escalatedAt) : "",
    e.closedBy ?? "",
    e.closedAt ? formatDateTime(e.closedAt) : "",
    e.resolutionNote ?? "",
  ])
  const csv = toCsv(
    [
      "At",
      "Severity",
      "Event",
      "Status",
      "Message",
      "Vehicle",
      "Provider",
      "Geozone",
      "Acknowledged by",
      "Acknowledged at",
      "Escalated to",
      "Escalated at",
      "Closed by",
      "Closed at",
      "Resolution note",
    ],
    rows
  )
  const today = new Date().toISOString().slice(0, 10)
  downloadTextFile(`ifms-events-${today}.csv`, csv)
}
