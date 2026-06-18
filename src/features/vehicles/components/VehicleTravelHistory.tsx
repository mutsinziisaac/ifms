import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
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
import { useTripsForVehicle } from "@/data/hooks"
import type { Trip } from "@/data/types"
import { formatDateTime, formatKm } from "@/lib/format"
import { boundsOf, padBounds } from "@/lib/maps"
import { cn } from "@/lib/utils"

const TRIP_COLOR = "#0d9488"

export function VehicleTravelHistory({ vehicleId }: { vehicleId: string }) {
  const { t } = useTranslation()
  const tripsQuery = useTripsForVehicle(vehicleId)
  const trips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data])
  const [selected, setSelected] = useState<Trip | null>(null)

  const bounds = useMemo(() => {
    const raw = boundsOf(trips.flatMap((t) => t.path))
    return raw ? padBounds(raw) : null
  }, [trips])

  const header = (
    <div className="mb-3 flex items-center gap-2">
      <RouteIcon className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">
        {t("vehicles.detail.travel.title")}
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
          title={t("vehicles.detail.travel.emptyTitle")}
          description={t("vehicles.detail.travel.emptyDescription")}
        />
      </Card>
    )
  }

  return (
    <Card className="gap-0 p-5">
      {header}

      <div className="h-[300px] overflow-hidden rounded-xl border">
        <FleetMap bounds={bounds}>
          {trips.map((trip) => (
            <RoutePolyline
              key={trip.id}
              path={trip.path}
              color={TRIP_COLOR}
              selected={selected?.id === trip.id}
            />
          ))}
        </FleetMap>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">
                {t("vehicles.detail.travel.colWhen")}
              </TableHead>
              <TableHead className="text-xs tracking-wider text-muted-foreground uppercase">
                {t("vehicles.detail.travel.colTrip")}
              </TableHead>
              <TableHead className="text-right text-xs tracking-wider text-muted-foreground uppercase">
                {t("vehicles.detail.travel.colDistance")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected ? (
        <Card className="mt-4 gap-0 p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {t("vehicles.detail.travel.playbackTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {selected.startAddress} → {selected.endAddress} ·{" "}
                {formatDateTime(selected.startAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSelected(null)}
              aria-label={t("vehicles.detail.travel.closePlayback")}
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
