import { useTranslation } from "react-i18next"
import { FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEvents, useTripsForVehicle } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { downloadTextFile, toCsv } from "@/lib/csv"
import { formatDateTime } from "@/lib/format"

/** Filesystem-safe slug from a plate, e.g. "3-45821 ET" -> "3-45821-ET". */
function slug(plate: string): string {
  return plate.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")
}

export function VehicleReportExport({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation()
  const events = useEvents().data ?? []
  const trips = useTripsForVehicle(vehicle.id).data ?? []

  const exportEvents = () => {
    const rows = events
      .filter((e) => e.vehicleId === vehicle.id)
      .map((e) => [
        t(`enums.eventSeverity.${e.severity}`),
        t(`enums.eventType.${e.type}`),
        t(`enums.eventStatus.${e.status}`),
        e.message,
        e.geozoneName ?? "",
        formatDateTime(e.at),
      ])
    if (rows.length === 0) {
      toast.info(t("vehicles.detail.report.noEvents"))
      return
    }
    const csv = toCsv(
      [
        t("vehicles.detail.report.eventHeaders.severity"),
        t("vehicles.detail.report.eventHeaders.event"),
        t("vehicles.detail.report.eventHeaders.status"),
        t("vehicles.detail.report.eventHeaders.message"),
        t("vehicles.detail.report.eventHeaders.geozone"),
        t("vehicles.detail.report.eventHeaders.at"),
      ],
      rows
    )
    downloadTextFile(`${slug(vehicle.plate)}-events.csv`, csv)
    toast.success(t("vehicles.detail.report.eventsExported"))
  }

  const exportTravel = () => {
    if (trips.length === 0) {
      toast.info(t("vehicles.detail.report.noTravel"))
      return
    }
    const rows = trips.map((trip) => [
      formatDateTime(trip.startAt),
      formatDateTime(trip.endAt),
      trip.startAddress,
      trip.endAddress,
      trip.distanceKm,
      trip.avgSpeedKmh,
      trip.maxSpeedKmh,
    ])
    const csv = toCsv(
      [
        t("vehicles.detail.report.travelHeaders.start"),
        t("vehicles.detail.report.travelHeaders.end"),
        t("vehicles.detail.report.travelHeaders.from"),
        t("vehicles.detail.report.travelHeaders.to"),
        t("vehicles.detail.report.travelHeaders.distance"),
        t("vehicles.detail.report.travelHeaders.avgSpeed"),
        t("vehicles.detail.report.travelHeaders.maxSpeed"),
      ],
      rows
    )
    downloadTextFile(`${slug(vehicle.plate)}-travel.csv`, csv)
    toast.success(t("vehicles.detail.report.travelExported"))
  }

  return (
    <Card className="flex-row flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {t("vehicles.detail.report.title")}
        </span>
        <span className="text-xs text-muted-foreground">
          {t("vehicles.detail.report.subtitle")}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={exportEvents}>
          {t("vehicles.detail.report.eventsCsv")}
        </Button>
        <Button variant="outline" size="sm" onClick={exportTravel}>
          {t("vehicles.detail.report.travelCsv")}
        </Button>
      </div>
    </Card>
  )
}
