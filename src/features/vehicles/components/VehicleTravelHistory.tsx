import { useMemo, useState } from "react"
import { ArrowRight, Route as RouteIcon, X } from "lucide-react"

import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FleetMap } from "@/components/map/FleetMap"
import { RoutePolyline } from "@/components/map/RoutePolyline"
import { TripPlayback } from "@/components/map/TripPlayback"
import {
  useAssignmentsForVehicle,
  useDrivers,
  useTripsForVehicle,
} from "@/data/hooks"
import type { Trip } from "@/data/types"
import { formatDateTime, formatKm, fullName } from "@/lib/format"
import { boundsOf, padBounds } from "@/lib/maps"
import { cn } from "@/lib/utils"

import { buildDriverColorMap, driverIdAt } from "./driver-attribution"

const UNKNOWN_COLOR = "#908e86"

export function VehicleTravelHistory({ vehicleId }: { vehicleId: string }) {
  const tripsQuery = useTripsForVehicle(vehicleId)
  const assignmentsQuery = useAssignmentsForVehicle(vehicleId)
  const driversQuery = useDrivers()
  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data])
  const assignments = useMemo(
    () => assignmentsQuery.data ?? [],
    [assignmentsQuery.data]
  )
  const drivers = useMemo(() => driversQuery.data ?? [], [driversQuery.data])
  const [selected, setSelected] = useState<Trip | null>(null)

  const colorOf = useMemo(
    () => buildDriverColorMap(assignments),
    [assignments]
  )

  // Attribute each trip to the driver assigned at its start time.
  const attributed = useMemo(
    () =>
      trips.map((trip) => {
        const driverId = driverIdAt(assignments, trip.startAt)
        const driver = driverId
          ? drivers.find((d) => d.id === driverId)
          : undefined
        return {
          trip,
          driverId,
          driverName: driver ? fullName(driver) : null,
          color: driverId ? (colorOf.get(driverId) ?? UNKNOWN_COLOR) : UNKNOWN_COLOR,
        }
      }),
    [trips, assignments, drivers, colorOf]
  )

  // Distinct drivers present in this vehicle's trips, for the legend.
  const legend = useMemo(() => {
    const seen = new Map<string, { name: string; color: string }>()
    for (const a of attributed) {
      const key = a.driverId ?? "unknown"
      if (!seen.has(key)) {
        seen.set(key, {
          name: a.driverName ?? "Unattributed",
          color: a.color,
        })
      }
    }
    return [...seen.values()]
  }, [attributed])

  const bounds = useMemo(() => {
    const raw = boundsOf(trips.flatMap((t) => t.path))
    return raw ? padBounds(raw) : null
  }, [trips])

  const header = (
    <div className="mb-3 flex items-center gap-2">
      <RouteIcon className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">Travel history</span>
      <span className="text-xs text-muted-foreground">
        · attributed by driver
      </span>
    </div>
  )

  if (tripsQuery.isLoading) {
    return (
      <Card className="gap-0 p-5">
        {header}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  if (trips.length === 0) {
    return (
      <Card className="gap-0 p-5">
        {header}
        <EmptyState
          icon={RouteIcon}
          title="No trip history"
          description="Completed trips for this vehicle will appear here for playback."
        />
      </Card>
    )
  }

  return (
    <Card className="gap-0 p-5">
      {header}

      <div className="h-[300px] overflow-hidden rounded-xl border">
        <FleetMap bounds={bounds}>
          {attributed.map((a) => (
            <RoutePolyline
              key={a.trip.id}
              path={a.trip.path}
              color={a.color}
              selected={selected?.id === a.trip.id}
            />
          ))}
        </FleetMap>
      </div>

      {legend.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {legend.map((l) => (
            <span
              key={l.name}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              {l.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">
                When
              </TableHead>
              <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">
                Trip
              </TableHead>
              <TableHead className="text-right text-xs tracking-wider text-muted-foreground uppercase">
                Distance
              </TableHead>
              <TableHead className="text-right text-xs tracking-wider text-muted-foreground uppercase">
                Driver
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attributed.map(({ trip, driverName, color }) => (
              <TableRow
                key={trip.id}
                onClick={() => setSelected(trip)}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-accent/50",
                  selected?.id === trip.id && "bg-accent/60"
                )}
              >
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(trip.startAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="max-w-36 truncate font-medium">
                      {trip.startAddress}
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="max-w-36 truncate font-medium">
                      {trip.endAddress}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  {formatKm(trip.distanceKm)}
                </TableCell>
                <TableCell className="text-right text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {driverName ?? "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected ? (
        <Card className="mt-4 gap-0 p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Trip playback</p>
              <p className="text-xs text-muted-foreground">
                {selected.startAddress} → {selected.endAddress} ·{" "}
                {formatDateTime(selected.startAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSelected(null)}
              aria-label="Close playback"
            >
              <X className="size-4" />
            </Button>
          </div>
          <TripPlayback path={selected.path} />
        </Card>
      ) : null}
    </Card>
  )
}
