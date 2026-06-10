// Display config for every status enum in the domain + the SRS maintenance
// status rule. Single source of truth for status colors across tables,
// badges, map markers and charts.

import { addDays, differenceInCalendarDays } from "date-fns"

import { formatDate, formatKm } from "@/lib/format"
import type {
  DriverStatus,
  EventRuleType,
  EventSeverity,
  EventStatus,
  EventType,
  MaintenanceStatus,
  MaintenanceTask,
  MaintenanceVehicleState,
  Vehicle,
  VehicleStatus,
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
// Driver status
// ---------------------------------------------------------------------------

export const DRIVER_STATUS_CONFIG: Record<
  DriverStatus,
  { label: string; badgeClass: string }
> = {
  active: {
    label: "Active",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  on_leave: {
    label: "On leave",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  suspended: {
    label: "Suspended",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  inactive: {
    label: "Inactive",
    badgeClass:
      "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
  },
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  entry: "Geozone entry",
  exit: "Geozone exit",
  speeding: "Speeding",
  no_signal: "Signal lost",
  idle: "Excessive idling",
}

export const EVENT_RULE_TYPE_LABEL: Record<EventRuleType, string> = {
  entry: "Geozone entry",
  exit: "Geozone exit",
  speeding: "Zone speed limit",
  global_speeding: "Fleet speed limit",
  idle: "Excessive idle",
  no_signal: "Signal timeout",
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
// Maintenance — SRS rule:
//   OK      remaining > 20% of interval
//   Waiting 0 < remaining <= 20% of interval
//   Delay   overdue (remaining <= 0)
// ---------------------------------------------------------------------------

export const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceStatus,
  { label: string; color: string; badgeClass: string }
> = {
  ok: {
    label: "OK",
    color: "#10b981",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  waiting: {
    label: "Waiting",
    color: "#f59e0b",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  delay: {
    label: "Delay",
    color: "#f43f5e",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
}

export interface MaintenanceComputation {
  status: MaintenanceStatus
  /** remaining / interval — can be negative when overdue */
  remainingPct: number
  /** "1,240 km left" | "Overdue by 320 km" | "6 days left" | "Overdue by 2 days" */
  remainingLabel: string
  /** "Due at 84,500 km" | "Due on 12 Jul 2026" */
  dueLabel: string
}

export function computeMaintenanceState(
  task: MaintenanceTask,
  state: MaintenanceVehicleState,
  vehicle: Vehicle | undefined,
  now: Date = new Date()
): MaintenanceComputation {
  if (task.paramType === "mileage") {
    const interval = task.intervalKm ?? 1
    const lastKm = state.lastServiceKm ?? 0
    const dueKm = lastKm + interval
    const remaining = dueKm - (vehicle?.odometerKm ?? lastKm)
    const remainingPct = remaining / interval
    return {
      status: statusFromPct(remainingPct),
      remainingPct,
      remainingLabel:
        remaining >= 0
          ? `${formatKm(remaining)} left`
          : `Overdue by ${formatKm(-remaining)}`,
      dueLabel: `Due at ${formatKm(dueKm)}`,
    }
  }

  const interval = task.intervalDays ?? 1
  const lastDate = state.lastServiceDate ? new Date(state.lastServiceDate) : now
  const dueDate = addDays(lastDate, interval)
  const remaining = differenceInCalendarDays(dueDate, now)
  const remainingPct = remaining / interval
  return {
    status: statusFromPct(remainingPct),
    remainingPct,
    remainingLabel:
      remaining >= 0
        ? `${remaining} day${remaining === 1 ? "" : "s"} left`
        : `Overdue by ${-remaining} day${remaining === -1 ? "" : "s"}`,
    dueLabel: `Due on ${formatDate(dueDate.toISOString())}`,
  }
}

function statusFromPct(remainingPct: number): MaintenanceStatus {
  if (remainingPct > 0.2) return "ok"
  if (remainingPct > 0) return "waiting"
  return "delay"
}
