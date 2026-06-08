import { RelativeTime } from "@/components/common/RelativeTime"
import { PageHeader } from "@/components/layout/PageHeader"
import { useLiveVehicles } from "@/data/hooks"

import { AlertsFeedCard } from "./components/AlertsFeedCard"
import { CorridorStatsCard } from "./components/CorridorStatsCard"
import { FleetStatusDonut } from "./components/FleetStatusDonut"
import { KpiRow } from "./components/KpiRow"
import { LiveFleetMapCard } from "./components/LiveFleetMapCard"

export function DashboardPage() {
  const vehicles = useLiveVehicles()

  const latestSync = vehicles.reduce<string | null>((latest, v) => {
    if (latest === null || v.lastSyncAt > latest) return v.lastSyncAt
    return latest
  }, null)

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Real-time visibility across the monitored fleet."
        actions={
          latestSync ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              Last updated <RelativeTime iso={latestSync} />
            </div>
          ) : undefined
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

        <AlertsFeedCard />
      </div>
    </div>
  )
}
