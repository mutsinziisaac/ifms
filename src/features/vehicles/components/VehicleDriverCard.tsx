import { useMemo } from "react"
import { Link } from "react-router-dom"
import { History, UserX } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAssignmentsForVehicle, useDrivers } from "@/data/hooks"
import type { Vehicle, VehicleDriverAssignment } from "@/data/types"
import { formatDateTime, fullName, initials } from "@/lib/format"

import { buildDriverColorMap } from "./driver-attribution"

export function VehicleDriverCard({ vehicle }: { vehicle: Vehicle }) {
  const query = useAssignmentsForVehicle(vehicle.id)
  const assignments = useMemo(() => query.data ?? [], [query.data])
  const drivers = useDrivers().data ?? []

  const colorOf = useMemo(
    () => buildDriverColorMap(assignments),
    [assignments]
  )

  const open = assignments.find((a) => a.endAt === null)
  const currentDriver = vehicle.driverId
    ? drivers.find((d) => d.id === vehicle.driverId)
    : undefined
  const previous = assignments.filter((a) => a.endAt !== null)

  const header = (
    <div className="mb-3 flex items-center gap-2">
      <History className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">Driver assignment history</span>
    </div>
  )

  if (query.isLoading) {
    return (
      <Card className="h-full gap-0 p-5">
        {header}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="h-full gap-0 p-5">
      {header}

      {/* Current driver — prominent, at the top. */}
      {currentDriver ? (
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials(fullName(currentDriver))}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/drivers/${currentDriver.id}`}
                className="text-sm font-medium hover:underline"
              >
                {fullName(currentDriver)}
              </Link>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                Active now
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {currentDriver.licenseNo}
              {open ? ` · since ${formatDateTime(open.startAt)}` : null}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-muted">
            <UserX className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Unassigned</p>
            <p className="mt-0.5 text-xs">No driver is currently at the wheel.</p>
          </div>
        </div>
      )}

      {/* Previous assignments. */}
      {previous.length > 0 ? (
        <div className="mt-4 border-t pt-4">
          <p className="mb-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Previous
          </p>
          <ol className="relative ml-1.5 space-y-3.5 border-l pl-5">
            {previous.map((a) => {
              const driver = drivers.find((d) => d.id === a.driverId)
              return (
                <PreviousRow
                  key={a.id}
                  assignment={a}
                  color={colorOf.get(a.driverId) ?? "#908e86"}
                  driverName={driver ? fullName(driver) : null}
                  driverId={a.driverId}
                />
              )
            })}
          </ol>
        </div>
      ) : null}
    </Card>
  )
}

function PreviousRow({
  assignment,
  color,
  driverName,
  driverId,
}: {
  assignment: VehicleDriverAssignment
  color: string
  driverName: string | null
  driverId: string
}) {
  return (
    <li className="relative">
      <span
        className="absolute top-1 -left-[27px] size-3 rounded-full ring-4 ring-background"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {driverName ? (
        <Link
          to={`/drivers/${driverId}`}
          className="text-sm font-medium hover:underline"
        >
          {driverName}
        </Link>
      ) : (
        <span className="text-sm font-medium text-muted-foreground italic">
          Removed driver
        </span>
      )}
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatDateTime(assignment.startAt)} →{" "}
        {assignment.endAt === null
          ? "present"
          : formatDateTime(assignment.endAt)}
      </p>
    </li>
  )
}
