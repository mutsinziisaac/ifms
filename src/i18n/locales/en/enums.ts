// Domain enum labels. Keys match the union members in src/data/types.ts so
// callers can do t(`enums.vehicleStatus.${status}`). Colors/classes stay in
// src/lib/status.ts — only these labels are translated.
export default {
  vehicleStatus: {
    moving: "Moving",
    idling: "Idling",
    ignition_off: "Ignition off",
    no_signal: "No signal",
    ignition_blocked: "Ignition blocked",
  },
  driverStatus: {
    active: "Active",
    on_leave: "On leave",
    suspended: "Suspended",
    inactive: "Inactive",
  },
  eventStatus: {
    open: "Open",
    acknowledged: "Acknowledged",
    escalated: "Escalated",
    closed: "Closed",
  },
  eventSeverity: {
    info: "Info",
    warning: "Warning",
    critical: "Critical",
  },
  eventType: {
    entry: "Geozone entry",
    exit: "Geozone exit",
    speeding: "Speeding",
    no_signal: "Signal lost",
    idle: "Excessive idling",
  },
  eventRuleType: {
    entry: "Geozone entry",
    exit: "Geozone exit",
    speeding: "Zone speed limit",
    global_speeding: "Fleet speed limit",
    idle: "Excessive idle",
    no_signal: "Signal timeout",
  },
  maintenanceStatus: {
    ok: "OK",
    waiting: "Waiting",
    delay: "Delay",
  },
  providerCategory: {
    ministry: "Ministry",
    agency: "Agency",
    enterprise: "Enterprise",
  },
  vehicleType: {
    truck: "Truck",
    trailer: "Trailer",
    tanker: "Tanker",
    bus: "Bus",
    container: "Container",
    pickup: "Pickup",
  },
}
