import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Map as MapIcon } from "lucide-react"

import { RelativeTime } from "@/components/common/RelativeTime"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { useLiveVehicles } from "@/data/hooks"

import { EventsFeedCard } from "./components/EventsFeedCard"
import { CorridorStatsCard } from "./components/CorridorStatsCard"
import { FleetStatusDonut } from "./components/FleetStatusDonut"
import { KpiRow } from "./components/KpiRow"
import { LiveFleetMapCard } from "./components/LiveFleetMapCard"

export function DashboardPage() {
  const { t } = useTranslation()
  const vehicles = useLiveVehicles()

  const latestSync = vehicles.reduce<string | null>((latest, v) => {
    if (latest === null || v.lastSyncAt > latest) return v.lastSyncAt
    return latest
  }, null)

  return (
    <div>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        actions={
          <div className="flex items-center gap-4">
            {latestSync ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                {t("dashboard.lastUpdated")} <RelativeTime iso={latestSync} />
              </div>
            ) : null}
            <Button asChild>
              <Link to="/live-map">
                <MapIcon className="size-4" />
                {t("dashboard.liveFleet.open")}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        <KpiRow />

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LiveFleetMapCard />
          </div>
          <div className="flex flex-col gap-4">
            <FleetStatusDonut />
            <CorridorStatsCard />
          </div>
        </div>

        <EventsFeedCard />
      </div>
    </div>
  )
}
