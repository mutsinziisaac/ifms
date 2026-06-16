import { Building2, Radio, Tag } from "lucide-react"
import { useTranslation } from "react-i18next"

import { VehicleStatusBadge } from "@/components/common/status-badges"
import { Card } from "@/components/ui/card"
import type { Entity, Vehicle } from "@/data/types"
import { VEHICLE_STATUS_CONFIG } from "@/lib/status"
import { cn } from "@/lib/utils"

export function VehicleIdentityHeader({
  vehicle,
  entity,
  actions,
}: {
  vehicle: Vehicle
  entity: Entity | undefined
  actions?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Card className="flex-row items-center gap-4 p-5">
      <span
        className={cn(
          "size-3.5 shrink-0 rounded-full",
          VEHICLE_STATUS_CONFIG[vehicle.status].dotClass
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-lg font-semibold tracking-tight">
            {vehicle.plate}
          </span>
          <span className="text-sm text-muted-foreground">
            {vehicle.description}
          </span>
          <VehicleStatusBadge status={vehicle.status} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-3.5" />
            {entity?.shortName ?? t("vehicles.detail.identity.entityFallback")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Tag className="size-3.5" />
            {t(`enums.vehicleType.${vehicle.type}`)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Radio className="size-3.5" />
            {vehicle.gpsProvider}
          </span>
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </Card>
  )
}
