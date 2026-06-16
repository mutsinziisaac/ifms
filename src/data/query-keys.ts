// Central query-key factory — every TanStack Query hook and invalidation
// must go through these keys so cross-page cache invalidation stays correct.

export const qk = {
  entities: ["entities"] as const,
  vehicles: ["vehicles"] as const,
  vehicle: (id: string) => ["vehicles", id] as const,
  drivers: ["drivers"] as const,
  driver: (id: string) => ["drivers", id] as const,
  geozones: ["geozones"] as const,
  geozoneGroups: ["geozone-groups"] as const,
  eventRules: ["event-rules"] as const,
  events: ["events"] as const,
  routes: ["routes"] as const,
  trips: ["trips"] as const,
  tripsForVehicle: (vehicleId: string) => ["trips", vehicleId] as const,
  assignments: ["assignments"] as const,
  assignmentsForVehicle: (vehicleId: string) =>
    ["assignments", vehicleId] as const,
  maintenanceTasks: ["maintenance-tasks"] as const,
  maintenanceServiceRecords: ["maintenance-service-records"] as const,
  maintenanceServiceRecordsForTask: (taskId: string) =>
    ["maintenance-service-records", taskId] as const,
  accidents: ["accidents"] as const,
  fines: ["fines"] as const,
  roles: ["roles"] as const,
  webUsers: ["web-users"] as const,
} as const
