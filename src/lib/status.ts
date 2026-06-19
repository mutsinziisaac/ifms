// Display config for every status enum in the domain. Single source of truth
// for status colors across tables, badges, map markers and charts.

import type {
  EventRuleType,
  EventSeverity,
  EventStatus,
  EventType,
  FleetEvent,
  IncidentRootCause,
  IncidentSeverity,
  ItmsVerificationStatus,
  VehicleRegistryStatus,
  VehicleStatus,
  WebUserStatus,
} from "@/data/types"

// ---------------------------------------------------------------------------
// Vehicle status
// ---------------------------------------------------------------------------

export interface VehicleStatusConfig {
  label: string
  /** Hex used for map markers and chart cells */
  color: string
  /** Tailwind classes for badge pills */
  badgeClass: string
  /** Tailwind class for small status dots */
  dotClass: string
}

export const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, VehicleStatusConfig> =
  {
    moving: {
      label: "Moving",
      color: "#10b981",
      badgeClass:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
      dotClass: "bg-emerald-500",
    },
    idling: {
      label: "Idling",
      color: "#f59e0b",
      badgeClass:
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
      dotClass: "bg-amber-500",
    },
    ignition_off: {
      label: "Ignition off",
      color: "#64748b",
      badgeClass:
        "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
      dotClass: "bg-slate-400",
    },
    no_signal: {
      label: "No signal",
      color: "#f43f5e",
      badgeClass:
        "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
      dotClass: "bg-rose-500",
    },
    ignition_blocked: {
      label: "Ignition blocked",
      color: "#8b5cf6",
      badgeClass:
        "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
      dotClass: "bg-violet-500",
    },
  }

// ---------------------------------------------------------------------------
// ITMS verification — colors only; labels are translated via
// t(`enums.itmsVerificationStatus.${value}`).
// ---------------------------------------------------------------------------

export const ITMS_VERIFICATION_CONFIG: Record<
  ItmsVerificationStatus,
  { color: string; badgeClass: string; dotClass: string }
> = {
  VERIFIED: {
    color: "#10b981",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  NOT_FOUND: {
    color: "#f43f5e",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
  UNVERIFIED: {
    color: "#f59e0b",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
}

// ---------------------------------------------------------------------------
// Vehicle registry status — colors only; labels are translated via
// t(`enums.vehicleRegistryStatus.${value}`).
// ---------------------------------------------------------------------------

export const VEHICLE_REGISTRY_CONFIG: Record<
  VehicleRegistryStatus,
  { color: string; badgeClass: string; dotClass: string }
> = {
  ACTIVE: {
    color: "#10b981",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  SUSPENDED: {
    color: "#f59e0b",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  RETIRED: {
    color: "#64748b",
    badgeClass:
      "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  BLOCKED: {
    color: "#f43f5e",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
}

/**
 * Tailwind row accent for the fleet table — gives rows that failed ITMS
 * verification (NOT_FOUND) a red left rail so they read as "needs attention".
 * Structural so both `Vehicle` and `VehiclePosition` rows can use it.
 */
export function verificationRowAccent(row: {
  itmsVerificationStatus: ItmsVerificationStatus
}): string {
  return row.itmsVerificationStatus === "NOT_FOUND"
    ? "border-l-2 border-l-rose-500 bg-rose-500/5"
    : ""
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  entry: "Geozone entry",
  exit: "Geozone exit",
  speeding: "Speeding",
  route_deviation: "Route deviation",
  no_signal: "Signal lost",
  idle: "Excessive idling",
  ignition: "Ignition state",
}

export const EVENT_RULE_TYPE_LABEL: Record<EventRuleType, string> = {
  entry: "Geozone entry",
  exit: "Geozone exit",
  speeding: "Zone speed limit",
  route_deviation: "Route deviation",
  global_speeding: "Fleet speed limit",
  idle: "Excessive idle",
  no_signal: "Signal timeout",
  ignition: "Ignition state",
}

/**
 * Tailwind row accent for the live events table — gives unresolved critical
 * violations a red alert treatment so the feed reads like real alerts.
 */
export function eventRowAccent(event: FleetEvent): string {
  if (event.severity !== "critical" || event.status === "closed") return ""
  return event.status === "open"
    ? "border-l-2 border-l-rose-500 bg-rose-500/5"
    : "border-l-2 border-l-rose-500/40"
}

export const EVENT_SEVERITY_CONFIG: Record<
  EventSeverity,
  { label: string; color: string; badgeClass: string; dotClass: string }
> = {
  info: {
    label: "Info",
    color: "#0ea5e9",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
    dotClass: "bg-sky-500",
  },
  warning: {
    label: "Warning",
    color: "#f59e0b",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  critical: {
    label: "Critical",
    color: "#f43f5e",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
}

export const EVENT_STATUS_CONFIG: Record<
  EventStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  open: {
    label: "Open",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
    dotClass: "bg-sky-500",
  },
  acknowledged: {
    label: "Acknowledged",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  escalated: {
    label: "Escalated",
    badgeClass:
      "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30",
    dotClass: "bg-violet-500",
  },
  closed: {
    label: "Closed",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
}

// ---------------------------------------------------------------------------
// Safety & incidents / web users — colors only; labels are translated via
// t(`enums.<group>.${value}`) per the i18n convention.
// ---------------------------------------------------------------------------

interface BadgeColorConfig {
  /** Hex used for chart cells */
  color: string
  badgeClass: string
  dotClass: string
}

export const INCIDENT_SEVERITY_CONFIG: Record<
  IncidentSeverity,
  BadgeColorConfig
> = {
  minor: {
    color: "#0ea5e9",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
    dotClass: "bg-sky-500",
  },
  medium: {
    color: "#f59e0b",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  major: {
    color: "#f43f5e",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
}

export const INCIDENT_ROOT_CAUSE_COLOR: Record<IncidentRootCause, string> = {
  driver_error: "#f43f5e",
  weather: "#0ea5e9",
  mechanical: "#f59e0b",
  other: "#64748b",
}

export const WEB_USER_STATUS_CONFIG: Record<WebUserStatus, BadgeColorConfig> = {
  active: {
    color: "#10b981",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  inactive: {
    color: "#64748b",
    badgeClass:
      "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
    dotClass: "bg-slate-400",
  },
  locked: {
    color: "#f43f5e",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
}
