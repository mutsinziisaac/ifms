// Report row builders for the Reports & Analytics module (SRS Reporting ID
// 31–34). Reports are *derived* from the existing FleetEvent / Vehicle / Driver
// / Geozone data — no new entity. Pure functions: given the data + filters,
// return a { columns, rows } table that feeds the on-screen preview and every
// export format (PDF / Excel / CSV) through @/lib/export.

import type { Driver, FleetEvent, Geozone, Vehicle } from "@/data/types"
import type { ExportColumn, ExportRow } from "@/lib/export"
import { formatCoords, formatDateTime, fullName } from "@/lib/format"
import i18n from "@/i18n"

export type ReportType = "events" | "geozones"
export type ReportBase = "vehicles" | "drivers"

export interface ReportFilters {
  base: ReportBase
  /** Selected vehicle ids (base="vehicles") or driver ids; empty = all. */
  selection: string[]
  /** Inclusive yyyy-mm-dd bounds, or null for open-ended. */
  fromDate: string | null
  toDate: string | null
}

export interface ReportContext {
  events: FleetEvent[]
  vehicles: Vehicle[]
  drivers: Driver[]
  geozones: Geozone[]
}

export interface ReportTable {
  columns: ExportColumn[]
  rows: ExportRow[]
}

function dateBounds(filters: ReportFilters): { from: number; to: number } {
  const from = filters.fromDate
    ? new Date(`${filters.fromDate}T00:00:00`).getTime()
    : Number.NEGATIVE_INFINITY
  const to = filters.toDate
    ? new Date(`${filters.toDate}T23:59:59.999`).getTime()
    : Number.POSITIVE_INFINITY
  return { from, to }
}

function buildLookups(ctx: ReportContext) {
  const vehicleById = new Map(ctx.vehicles.map((v) => [v.id, v]))
  const driverById = new Map(ctx.drivers.map((d) => [d.id, d]))
  const driverIdOfVehicle = (vehicleId: string): string | null =>
    vehicleById.get(vehicleId)?.driverId ?? null
  const driverNameOfVehicle = (vehicleId: string): string => {
    const id = driverIdOfVehicle(vehicleId)
    const driver = id ? driverById.get(id) : undefined
    return driver ? fullName(driver) : "—"
  }
  return { driverIdOfVehicle, driverNameOfVehicle }
}

function matchesSelection(
  filters: ReportFilters,
  vehicleId: string,
  driverIdOfVehicle: (vehicleId: string) => string | null
): boolean {
  if (filters.selection.length === 0) return true
  if (filters.base === "vehicles") return filters.selection.includes(vehicleId)
  const driverId = driverIdOfVehicle(vehicleId)
  return driverId !== null && filters.selection.includes(driverId)
}

/** "2h 14m" / "45m" / "3d 4h" from a positive millisecond span. */
function formatDurationMs(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000))
  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

/** Events report — one row per FleetEvent in range (SRS ID 33 Events Report). */
export function buildEventsReport(
  ctx: ReportContext,
  filters: ReportFilters
): ReportTable {
  const t = i18n.t.bind(i18n)
  const { driverIdOfVehicle, driverNameOfVehicle } = buildLookups(ctx)
  const { from, to } = dateBounds(filters)

  const columns: ExportColumn[] = [
    { header: t("reports.columns.event"), key: "event" },
    { header: t("reports.columns.condition"), key: "condition" },
    { header: t("reports.columns.severity"), key: "severity" },
    { header: t("reports.columns.startTime"), key: "time" },
    { header: t("reports.columns.vehicle"), key: "vehicle" },
    { header: t("reports.columns.driver"), key: "driver" },
    { header: t("reports.columns.location"), key: "location" },
    { header: t("reports.columns.coordinates"), key: "coords" },
    { header: t("reports.columns.status"), key: "status" },
  ]

  const rows: ExportRow[] = ctx.events
    .filter((e) => {
      const ms = new Date(e.at).getTime()
      return ms >= from && ms <= to
    })
    .filter((e) => matchesSelection(filters, e.vehicleId, driverIdOfVehicle))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .map((e) => [
      t(`enums.eventType.${e.type}`),
      e.message,
      t(`enums.eventSeverity.${e.severity}`),
      formatDateTime(e.at),
      e.vehiclePlate,
      driverNameOfVehicle(e.vehicleId),
      e.geozoneName ?? "—",
      formatCoords(e.location),
      t(`enums.eventStatus.${e.status}`),
    ])

  return { columns, rows }
}

/**
 * Geozones report — one row per geozone visit (SRS ID 33 Geozones Report).
 * A visit is an "entry" event paired with the earliest later "exit" event for
 * the same vehicle + geozone; dwell ("driving time") is the gap, or "—" when no
 * matching exit was recorded. Range filtering is on the entry time.
 */
export function buildGeozonesReport(
  ctx: ReportContext,
  filters: ReportFilters
): ReportTable {
  const t = i18n.t.bind(i18n)
  const { driverIdOfVehicle, driverNameOfVehicle } = buildLookups(ctx)
  const { from, to } = dateBounds(filters)

  const columns: ExportColumn[] = [
    { header: t("reports.columns.geozone"), key: "geozone" },
    { header: t("reports.columns.vehicle"), key: "vehicle" },
    { header: t("reports.columns.driver"), key: "driver" },
    { header: t("reports.columns.entered"), key: "entered" },
    { header: t("reports.columns.exited"), key: "exited" },
    { header: t("reports.columns.dwell"), key: "dwell" },
    { header: t("reports.columns.location"), key: "location" },
  ]

  const zoneEvents = ctx.events
    .filter(
      (e) =>
        (e.type === "entry" || e.type === "exit") &&
        e.geozoneId !== null &&
        matchesSelection(filters, e.vehicleId, driverIdOfVehicle)
    )
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))

  const entries = zoneEvents.filter((e) => e.type === "entry")
  const exits = zoneEvents.filter((e) => e.type === "exit")

  const rows: ExportRow[] = entries
    .filter((e) => {
      const ms = new Date(e.at).getTime()
      return ms >= from && ms <= to
    })
    .map((entry) => {
      const entryMs = new Date(entry.at).getTime()
      const exit = exits.find(
        (x) =>
          x.vehicleId === entry.vehicleId &&
          x.geozoneId === entry.geozoneId &&
          new Date(x.at).getTime() > entryMs
      )
      const dwell = exit
        ? formatDurationMs(new Date(exit.at).getTime() - entryMs)
        : "—"
      return [
        entry.geozoneName ?? "—",
        entry.vehiclePlate,
        driverNameOfVehicle(entry.vehicleId),
        formatDateTime(entry.at),
        exit ? formatDateTime(exit.at) : "—",
        dwell,
        formatCoords(entry.location),
      ]
    })

  return { columns, rows }
}

export function buildReport(
  type: ReportType,
  ctx: ReportContext,
  filters: ReportFilters
): ReportTable {
  return type === "events"
    ? buildEventsReport(ctx, filters)
    : buildGeozonesReport(ctx, filters)
}
