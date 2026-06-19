// Central query-key factory — every TanStack Query hook and invalidation
// must go through these keys so cross-page cache invalidation stays correct.

export const qk = {
  entities: ["entities"] as const,
  providers: ["providers"] as const,
  // A provider's dummy vehicle-positions batch (no backend endpoint yet). Keyed
  // by code + the verification tally (which sizes/shapes the fleet) under the
  // "providers" prefix so it shares their cache scope.
  providerPositions: (
    code: string,
    stats: { submitted: number; verified: number; unverified: number; notFound: number }
  ) =>
    [
      "providers",
      "positions",
      code,
      stats.submitted,
      stats.verified,
      stats.unverified,
      stats.notFound,
    ] as const,
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
  // The Alerts page list (GET /api/v1/alerts) — keyed by the server-side filter +
  // page so each combination caches separately. Workflow mutations invalidate the
  // whole ["alerts"] prefix so both the list and the counts below refresh.
  alerts: (params: {
    status?: string
    alertType?: string
    pageNumber: number
    pageSize: number
  }) => ["alerts", params] as const,
  alertCounts: (status?: string) =>
    ["alerts", "count", status ?? "all"] as const,
  routes: ["routes"] as const,
  trips: ["trips"] as const,
  tripsForVehicle: (vehicleId: string) => ["trips", vehicleId] as const,
  accidents: ["accidents"] as const,
  roles: ["roles"] as const,
  webUsers: ["web-users"] as const,
} as const
