import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Map as MapIcon, Table2 } from "lucide-react"

import { FleetLiveMap } from "@/components/map/FleetLiveMap"
import { FleetMapLegend } from "@/components/map/FleetMapLegend"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLiveVehicles } from "@/data/hooks"
import { VehicleTable } from "@/features/vehicles/components/VehicleTable"

/**
 * Full-screen live fleet view: a live map of every monitored vehicle with a tab
 * to switch to the searchable vehicle table. Reached from the dashboard button.
 */
export function LiveMapPage() {
  const { t } = useTranslation()
  const vehicles = useLiveVehicles()

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("dashboard.liveFleet.pageTitle")}
        description={t("dashboard.liveFleet.pageDescription")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="size-4" />
              {t("dashboard.title")}
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="map" className="flex min-h-0 flex-1 flex-col gap-4">
        <TabsList variant="line" className="self-start">
          <TabsTrigger value="map">
            <MapIcon />
            {t("dashboard.liveFleet.tabMap")}
          </TabsTrigger>
          <TabsTrigger value="table">
            <Table2 />
            {t("dashboard.liveFleet.tabTable")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="min-h-0">
          <div className="relative h-full min-h-[460px]">
            <FleetLiveMap className="h-full border" />
            <FleetMapLegend className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-lg border bg-background/90 px-3 py-2 shadow-sm backdrop-blur" />
          </div>
        </TabsContent>

        <TabsContent value="table" className="min-h-0 overflow-auto">
          <VehicleTable vehicles={vehicles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
