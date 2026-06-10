import { FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  useAssignmentsForVehicle,
  useDrivers,
  useEvents,
  useTripsForVehicle,
} from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { downloadTextFile, toCsv } from "@/lib/csv"
import { formatDateTime, fullName } from "@/lib/format"
import {
  EVENT_SEVERITY_CONFIG,
  EVENT_STATUS_CONFIG,
  EVENT_TYPE_LABEL,
} from "@/lib/status"

import { driverIdAt } from "./driver-attribution"

/** Filesystem-safe slug from a plate, e.g. "3-45821 ET" -> "3-45821-ET". */
function slug(plate: string): string {
  return plate.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")
}

export function VehicleReportExport({ vehicle }: { vehicle: Vehicle }) {
  const events = useEvents().data ?? []
  const trips = useTripsForVehicle(vehicle.id).data ?? []
  const assignments = useAssignmentsForVehicle(vehicle.id).data ?? []
  const drivers = useDrivers().data ?? []

  const exportEvents = () => {
    const rows = events
      .filter((e) => e.vehicleId === vehicle.id)
      .map((e) => [
        EVENT_SEVERITY_CONFIG[e.severity].label,
        EVENT_TYPE_LABEL[e.type],
        EVENT_STATUS_CONFIG[e.status].label,
        e.message,
        e.geozoneName ?? "",
        formatDateTime(e.at),
      ])
    if (rows.length === 0) {
      toast.info("No events to export for this vehicle")
      return
    }
    const csv = toCsv(
      ["Severity", "Event", "Status", "Message", "Geozone", "At"],
      rows
    )
    downloadTextFile(`${slug(vehicle.plate)}-events.csv`, csv)
    toast.success("Events report exported")
  }

  const exportTravel = () => {
    if (trips.length === 0) {
      toast.info("No travel history to export for this vehicle")
      return
    }
    const rows = trips.map((t) => {
      const driverId = driverIdAt(assignments, t.startAt)
      const driver = driverId
        ? drivers.find((d) => d.id === driverId)
        : undefined
      return [
        formatDateTime(t.startAt),
        formatDateTime(t.endAt),
        t.startAddress,
        t.endAddress,
        t.distanceKm,
        t.avgSpeedKmh,
        t.maxSpeedKmh,
        driver ? fullName(driver) : "Unattributed",
      ]
    })
    const csv = toCsv(
      [
        "Start",
        "End",
        "From",
        "To",
        "Distance (km)",
        "Avg speed (km/h)",
        "Max speed (km/h)",
        "Driver",
      ],
      rows
    )
    downloadTextFile(`${slug(vehicle.plate)}-travel.csv`, csv)
    toast.success("Travel history exported")
  }

  return (
    <Card className="flex-row flex-wrap items-center justify-between gap-4 p-5">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Reports</span>
        <span className="text-xs text-muted-foreground">
          Events &amp; travel history (CSV / Excel)
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={exportEvents}>
          Events (CSV)
        </Button>
        <Button variant="outline" size="sm" onClick={exportTravel}>
          Travel history (CSV)
        </Button>
      </div>
    </Card>
  )
}
