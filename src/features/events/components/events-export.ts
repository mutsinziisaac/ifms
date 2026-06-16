import type { Entity, FleetEvent } from "@/data/types"
import i18n from "@/i18n"
import { downloadTextFile, toCsv } from "@/lib/csv"
import { formatDateTime } from "@/lib/format"

/** Demo-grade event report: the filtered set with full workflow columns. */
export function exportEventsCsv(
  events: FleetEvent[],
  entities: Entity[]
): void {
  const { t } = i18n
  const entityName = new Map(entities.map((e) => [e.id, e.name]))
  const rows = events.map((e) => [
    formatDateTime(e.at),
    t(`enums.eventSeverity.${e.severity}`),
    t(`enums.eventType.${e.type}`),
    t(`enums.eventStatus.${e.status}`),
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
      t("events.export.at"),
      t("events.export.severity"),
      t("events.export.event"),
      t("events.export.status"),
      t("events.export.message"),
      t("events.export.vehicle"),
      t("events.export.provider"),
      t("events.export.geozone"),
      t("events.export.acknowledgedBy"),
      t("events.export.acknowledgedAt"),
      t("events.export.escalatedTo"),
      t("events.export.escalatedAt"),
      t("events.export.closedBy"),
      t("events.export.closedAt"),
      t("events.export.resolutionNote"),
    ],
    rows
  )
  const today = new Date().toISOString().slice(0, 10)
  downloadTextFile(`ifms-events-${today}.csv`, csv)
}
