import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  DRIVER_STATUS_CONFIG,
  EVENT_SEVERITY_CONFIG,
  EVENT_STATUS_CONFIG,
  INCIDENT_SEVERITY_CONFIG,
  VEHICLE_STATUS_CONFIG,
  WEB_USER_STATUS_CONFIG,
} from "@/lib/status"
import type {
  DriverStatus,
  EventSeverity,
  EventStatus,
  IncidentSeverity,
  VehicleStatus,
  WebUserStatus,
} from "@/data/types"

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const { t } = useTranslation()
  const config = VEHICLE_STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {t(`enums.vehicleStatus.${status}`)}
    </Badge>
  )
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const { t } = useTranslation()
  const config = DRIVER_STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      {t(`enums.driverStatus.${status}`)}
    </Badge>
  )
}

export function EventSeverityBadge({ severity }: { severity: EventSeverity }) {
  const { t } = useTranslation()
  const config = EVENT_SEVERITY_CONFIG[severity]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {t(`enums.eventSeverity.${severity}`)}
    </Badge>
  )
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { t } = useTranslation()
  const config = EVENT_STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {t(`enums.eventStatus.${status}`)}
    </Badge>
  )
}

export function IncidentSeverityBadge({
  severity,
}: {
  severity: IncidentSeverity
}) {
  const { t } = useTranslation()
  const config = INCIDENT_SEVERITY_CONFIG[severity]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {t(`enums.incidentSeverity.${severity}`)}
    </Badge>
  )
}

export function WebUserStatusBadge({ status }: { status: WebUserStatus }) {
  const { t } = useTranslation()
  const config = WEB_USER_STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {t(`enums.webUserStatus.${status}`)}
    </Badge>
  )
}
