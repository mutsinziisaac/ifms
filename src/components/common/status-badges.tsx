import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  EVENT_SEVERITY_CONFIG,
  EVENT_STATUS_CONFIG,
  INCIDENT_SEVERITY_CONFIG,
  ITMS_VERIFICATION_CONFIG,
  VEHICLE_REGISTRY_CONFIG,
  VEHICLE_STATUS_CONFIG,
  WEB_USER_STATUS_CONFIG,
} from "@/lib/status"
import type {
  EventSeverity,
  EventStatus,
  IncidentSeverity,
  ItmsVerificationStatus,
  VehicleRegistryStatus,
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

export function VerificationBadge({
  status,
}: {
  status: ItmsVerificationStatus
}) {
  const { t } = useTranslation()
  const config = ITMS_VERIFICATION_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {t(`enums.itmsVerificationStatus.${status}`)}
    </Badge>
  )
}

export function RegistryStatusBadge({
  status,
}: {
  status: VehicleRegistryStatus
}) {
  const { t } = useTranslation()
  const config = VEHICLE_REGISTRY_CONFIG[status]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, "gap-1.5")}>
      <span className={cn("size-1.5 rounded-full", config.dotClass)} />
      {t(`enums.vehicleRegistryStatus.${status}`)}
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
