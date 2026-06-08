import { Bell, BellOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { ALERT_SEVERITY_CONFIG, ALERT_TYPE_LABEL } from "@/lib/status"
import { useAlerts, useMarkAllAlertsRead } from "@/data/hooks"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationsBell() {
  const alerts = useAlerts().data ?? []
  const markAllRead = useMarkAllAlertsRead()

  const unread = alerts.filter((a) => !a.read).length
  const latest = alerts.slice(0, 20)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-medium text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">Notifications</span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => markAllRead.mutate()}
          >
            Mark all read
          </Button>
        </div>
        <ScrollArea className="h-80">
          {latest.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <BellOff className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            latest.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "border-b p-3 last:border-0",
                  !alert.read && "bg-accent/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      ALERT_SEVERITY_CONFIG[alert.severity].dotClass
                    )}
                  />
                  <span
                    className={cn(
                      "truncate text-sm",
                      !alert.read && "font-medium"
                    )}
                  >
                    {alert.message}
                  </span>
                </div>
                <p className="pl-4 text-xs text-muted-foreground">
                  {ALERT_TYPE_LABEL[alert.type]} ·{" "}
                  {formatRelativeTime(alert.at)}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
