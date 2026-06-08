import { useMemo } from "react"
import { Bell } from "lucide-react"

import { RelativeTime } from "@/components/common/RelativeTime"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAlerts } from "@/data/hooks"
import { ALERT_SEVERITY_CONFIG, ALERT_TYPE_LABEL } from "@/lib/status"
import { cn } from "@/lib/utils"

const MAX_EVENTS = 6

export function VehicleEventsCard({ vehicleId }: { vehicleId: string }) {
  const alertsQuery = useAlerts()
  const alerts = useMemo(
    () =>
      (alertsQuery.data ?? [])
        .filter((a) => a.vehicleId === vehicleId)
        .slice(0, MAX_EVENTS),
    [alertsQuery.data, vehicleId]
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
      {alertsQuery.isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          No geozone, speeding or signal events recorded.
        </p>
      ) : (
        <ul className="divide-y">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    ALERT_SEVERITY_CONFIG[alert.severity].dotClass
                  )}
                />
                <span className="truncate text-sm">
                  {ALERT_TYPE_LABEL[alert.type]}
                  {alert.geozoneName ? (
                    <span className="text-muted-foreground">
                      {" "}
                      · {alert.geozoneName}
                    </span>
                  ) : null}
                </span>
              </span>
              <RelativeTime
                iso={alert.at}
                className="shrink-0 text-xs text-muted-foreground"
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
