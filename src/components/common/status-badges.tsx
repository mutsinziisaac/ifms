import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  DRIVER_STATUS_CONFIG,
  EVENT_SEVERITY_CONFIG,
  EVENT_STATUS_CONFIG,
  MAINTENANCE_STATUS_CONFIG,
  VEHICLE_STATUS_CONFIG,
} from "@/lib/status"
import type {
  DriverStatus,
  EventSeverity,
  EventStatus,
  MaintenanceStatus,
  VehicleStatus,
} from "@/data/types"

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const config = VEHICLE_STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </Badge>
  )
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const config = DRIVER_STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      {config.label}
    </Badge>
  )
}

export function MaintenanceStatusBadge({
  status,
}: {
  status: MaintenanceStatus
}) {
  const config = MAINTENANCE_STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      {config.label}
    </Badge>
  )
}

export function EventSeverityBadge({ severity }: { severity: EventSeverity }) {
  const config = EVENT_SEVERITY_CONFIG[severity]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </Badge>
  )
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const config = EVENT_STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </Badge>
  )
}
