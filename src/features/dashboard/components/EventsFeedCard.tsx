import { BellOff, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/common/EmptyState"
import { RelativeTime } from "@/components/common/RelativeTime"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLiveEvents } from "@/data/hooks"
import { EVENT_SEVERITY_CONFIG } from "@/lib/status"
import { cn } from "@/lib/utils"

export function EventsFeedCard() {
  const { t } = useTranslation()
  const events = useLiveEvents(12)

  return (
    <Card className="gap-0">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>{t("dashboard.events.title")}</CardTitle>
        <Link
          to="/events"
          className="flex items-center gap-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          {t("dashboard.events.viewAll")}
          <ChevronRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="px-0 pt-2">
        {events.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={t("dashboard.events.emptyTitle")}
            description={t("dashboard.events.emptyDescription")}
          />
        ) : (
          <ScrollArea className="h-[372px]">
            <ul className="divide-y">
              {events.map((event) => {
                const severity = EVENT_SEVERITY_CONFIG[event.severity]
                return (
                  <li
                    key={event.id}
                    className={cn(
                      "flex items-start gap-3 px-6 py-3 transition-colors",
                      !event.read && "bg-primary/[0.04]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        severity.dotClass
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{event.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t(`enums.eventType.${event.type}`)} ·{" "}
                        {t(`enums.eventStatus.${event.status}`)} ·{" "}
                        <RelativeTime iso={event.at} />
                      </p>
                    </div>
                    <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                      {event.vehiclePlate}
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
