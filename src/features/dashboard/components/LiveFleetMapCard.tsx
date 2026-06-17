import { useTranslation } from "react-i18next"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FleetLiveMap } from "@/components/map/FleetLiveMap"
import { FleetMapLegend } from "@/components/map/FleetMapLegend"

export function LiveFleetMapCard() {
  const { t } = useTranslation()

  return (
    <Card className="relative h-full gap-0 overflow-hidden before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-[3px] before:bg-gradient-to-r before:from-amber-400 before:via-amber-500 before:to-transparent">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          {t("dashboard.liveFleet.title")}
        </CardTitle>
        <FleetMapLegend />
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-0 pt-4">
        <div className="min-h-[460px] flex-1">
          <FleetLiveMap className="rounded-none" />
        </div>
      </CardContent>
    </Card>
  )
}
