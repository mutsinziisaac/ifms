// Central query-key factory — every TanStack Query hook and invalidation
// must go through these keys so cross-page cache invalidation stays correct.

export const qk = {
  entities: ["entities"] as const,
  providers: ["providers"] as const,
  vehicles: ["vehicles"] as const,
  // The fleet list, optionally scoped to an ITMS verification status. Keyed
  // under the "vehicles" prefix so the existing invalidations still match it.
  vehiclesList: (verification?: string) =>
    ["vehicles", "list", verification ?? "all"] as const,
  // The Fleet verification queue (GET /vehicles?filter=verification). Under the
  // "vehicles" prefix so verification-stream invalidations refresh it too.
  vehiclesVerification: ["vehicles", "verification"] as const,
  // Live map snapshot (polled). Under the "vehicles" prefix so verification-stream
  // invalidations reach it too.
  vehiclesMap: ["vehicles", "map"] as const,
  vehicle: (id: string) => ["vehicles", id] as const,
  geozones: ["geozones"] as const,
  geozoneGroups: ["geozone-groups"] as const,
  eventRules: ["event-rules"] as const,
  events: ["events"] as const,
  routes: ["routes"] as const,
  trips: ["trips"] as const,
  tripsForVehicle: (vehicleId: string) => ["trips", vehicleId] as const,
  accidents: ["accidents"] as const,
  roles: ["roles"] as const,
  webUsers: ["web-users"] as const,
} as const
