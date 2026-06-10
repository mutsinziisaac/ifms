import { useMemo } from "react"
import { Bell } from "lucide-react"

import { RelativeTime } from "@/components/common/RelativeTime"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEvents } from "@/data/hooks"
import { EVENT_SEVERITY_CONFIG, EVENT_TYPE_LABEL } from "@/lib/status"
import { cn } from "@/lib/utils"

const MAX_EVENTS = 6

export function VehicleEventsCard({ vehicleId }: { vehicleId: string }) {
  const eventsQuery = useEvents()
  const events = useMemo(
    () =>
      (eventsQuery.data ?? [])
        .filter((e) => e.vehicleId === vehicleId)
        .slice(0, MAX_EVENTS),
    [eventsQuery.data, vehicleId]
  )

  const header = (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Recent events</span>
      </div>
    </div>
  )

  return (
    <Card className="h-full gap-0 p-5">
      {header}
      {eventsQuery.isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          No geozone, speeding or signal events recorded.
        </p>
      ) : (
        <ul className="divide-y">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    EVENT_SEVERITY_CONFIG[event.severity].dotClass
                  )}
                />
                <span className="truncate text-sm">
                  {EVENT_TYPE_LABEL[event.type]}
                  {event.geozoneName ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {event.geozoneName}
                    </span>
                  ) : null}
                </span>
              </span>
              <RelativeTime
                iso={event.at}
                className="shrink-0 text-xs text-muted-foreground"
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
