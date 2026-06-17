import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Building2,
  Navigation,
  PauseCircle,
  Plus,
  PowerOff,
  Truck,
  WifiOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { useEntities, useVehicles } from "@/data/hooks"

import { VehicleFormDialog } from "./components/VehicleFormDialog"
import { VehicleTable } from "./components/VehicleTable"

export function VehiclesPage() {
  const { t } = useTranslation()

  const vehiclesQuery = useVehicles()
  const vehicles = vehiclesQuery.data ?? []
  const entities = useEntities().data ?? []

  const [createOpen, setCreateOpen] = useState(false)

  // Stat cards — every vehicle falls into exactly one of these buckets, so the
  // breakdown reconciles with the total. "Stopped" folds the two parked states
  // (ignition off + ignition blocked).
  const movingCount = vehicles.filter((v) => v.status === "moving").length
  const idlingCount = vehicles.filter((v) => v.status === "idling").length
  const stoppedCount = vehicles.filter(
    (v) => v.status === "ignition_off" || v.status === "ignition_blocked"
  ).length
  const noSignalCount = vehicles.filter((v) => v.status === "no_signal").length

  return (
    <div>
      <PageHeader
        title={t("vehicles.title")}
        description={t("vehicles.description")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("vehicles.addVehicle")}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label={t("vehicles.stats.total")}
          value={vehicles.length}
          icon={Truck}
        />
        <StatCard
          label={t("vehicles.stats.moving")}
          value={movingCount}
          icon={Navigation}
          intent="success"
        />
        <StatCard
          label={t("vehicles.stats.idling")}
          value={idlingCount}
          icon={PauseCircle}
          intent="warning"
        />
        <StatCard
          label={t("vehicles.stats.stopped")}
          value={stoppedCount}
          icon={PowerOff}
        />
        <StatCard
          label={t("vehicles.stats.noSignal")}
          value={noSignalCount}
          icon={WifiOff}
          intent="danger"
        />
        <StatCard
          label={t("vehicles.stats.entitiesMonitored")}
          value={entities.length}
          icon={Building2}
        />
      </div>

      <VehicleTable vehicles={vehicles} isLoading={vehiclesQuery.isLoading} />

      <VehicleFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
