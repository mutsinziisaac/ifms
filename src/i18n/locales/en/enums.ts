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
    route_deviation: "Route deviation",
    no_signal: "Signal lost",
    idle: "Excessive idling",
    ignition: "Ignition state",
  },
  // Backend alert filter vocabulary (GET /api/v1/alerts params).
  alertStatus: {
    OPEN: "Open",
    ACKNOWLEDGED: "Acknowledged",
    RESOLVED: "Resolved",
  },
  alertType: {
    SPEED: "Speeding",
    GEOFENCE: "Geofence",
    IGNITION: "Ignition",
    TIME_AND_DISTANCE: "Idle / distance",
  },
  eventRuleType: {
    entry: "Geozone entry",
    exit: "Geozone exit",
    speeding: "Zone speed limit",
    route_deviation: "Route deviation",
    global_speeding: "Fleet speed limit",
    idle: "Excessive idle",
    no_signal: "Signal timeout",
    ignition: "Ignition state",
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
    saloon: "Saloon",
    suv: "SUV",
    minibus: "Minibus",
    van: "Van",
  },
  itmsVerificationStatus: {
    VERIFIED: "Verified",
    NOT_FOUND: "Failed",
    UNVERIFIED: "Unverified",
  },
  vehicleRegistryStatus: {
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
    RETIRED: "Retired",
    BLOCKED: "Blocked",
  },
  incidentSeverity: {
    minor: "Minor",
    medium: "Medium",
    major: "Major",
  },
  incidentRootCause: {
    driver_error: "Driver error",
    weather: "Weather",
    mechanical: "Mechanical failure",
    other: "Other",
  },
  webUserStatus: {
    active: "Active",
    inactive: "Inactive",
    locked: "Locked",
  },
  roleType: {
    admin: "Admin",
    fms: "FMS",
  },
}
