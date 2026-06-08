import { BellOff, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import { EmptyState } from "@/components/common/EmptyState"
import { RelativeTime } from "@/components/common/RelativeTime"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLiveAlerts } from "@/data/hooks"
import { ALERT_SEVERITY_CONFIG, ALERT_TYPE_LABEL } from "@/lib/status"
import { cn } from "@/lib/utils"

export function AlertsFeedCard() {
  const alerts = useLiveAlerts(12)

  return (
    <Card className="gap-0">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>Recent alerts</CardTitle>
        <Link
          to="/geozones"
          className="flex items-center gap-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          View all
          <ChevronRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="px-0 pt-2">
        {alerts.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No alerts"
            description="The fleet is operating within all configured rules."
          />
        ) : (
          <ScrollArea className="h-[372px]">
            <ul className="divide-y">
              {alerts.map((alert) => {
                const severity = ALERT_SEVERITY_CONFIG[alert.severity]
                return (
                  <li
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-3 px-6 py-3 transition-colors",
                      !alert.read && "bg-primary/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        severity.dotClass
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{alert.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ALERT_TYPE_LABEL[alert.type]} ·{" "}
                        <RelativeTime iso={alert.at} />
                      </p>
                    </div>
                    <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {alert.vehiclePlate}
                    </span>
                  </li>
                )
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
