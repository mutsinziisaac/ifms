import { useTranslation } from "react-i18next"

import { VEHICLE_STATUSES } from "@/data/types"
import { VEHICLE_STATUS_CONFIG } from "@/lib/status"
import { cn } from "@/lib/utils"

/** Status colour key shared by the dashboard card and the live map page. */
export function FleetMapLegend({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5",
        className
      )}
    >
      {VEHICLE_STATUSES.map((status) => (
        <span
          key={status}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: VEHICLE_STATUS_CONFIG[status].color }}
          />
          {t(`enums.vehicleStatus.${status}`)}
        </span>
      ))}
    </div>
  )
}
