import { Bell, BellOff } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import { EVENT_SEVERITY_CONFIG } from "@/lib/status"
import { useEvents, useMarkAllEventsRead } from "@/data/hooks"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationsBell() {
  const { t } = useTranslation()
  const events = useEvents().data ?? []
  const markAllRead = useMarkAllEventsRead()

  const unread = events.filter((e) => !e.read).length
  const latest = events.slice(0, 20)

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
          <span className="sr-only">{t("topbar.notifications.aria")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium">
            {t("topbar.notifications.title")}
          </span>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => markAllRead.mutate()}
          >
            {t("common.markAllRead")}
          </Button>
        </div>
        <ScrollArea className="h-80">
          {latest.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <BellOff className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("topbar.notifications.empty")}
              </p>
            </div>
          ) : (
            latest.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "border-b p-3 last:border-0",
                  !event.read && "bg-accent/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      EVENT_SEVERITY_CONFIG[event.severity].dotClass
                    )}
                  />
                  <span
                    className={cn(
                      "truncate text-sm",
                      !event.read && "font-medium"
                    )}
                  >
                    {event.message}
                  </span>
                </div>
                <p className="pl-4 text-xs text-muted-foreground">
                  {t(`enums.eventType.${event.type}`)} ·{" "}
                  {formatRelativeTime(event.at)}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
