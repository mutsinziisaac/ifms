// Providers feature: list page (stat cards, provider table) and detail page
// (lifecycle row, device stats, recent events, per-device table). Provider data
// comes from the live `/providers` endpoint — identity + lifecycle only. Shared
// terms (actions, table chrome, enum labels, form labels) live under
// common/enums/forms.
export default {
  title: "Providers",
  description:
    "Government institutions transmitting device data to the MoTL platform.",
  searchPlaceholder: "Search providers…",
  emptyTitle: "No providers found",
  emptyDescription: "Try a different search.",
  active: "Active",
  inactive: "Inactive",

  stats: {
    providers: "Providers",
    providersHint: "Registered with the platform",
    activeProviders: "Active providers",
    activeProvidersHint: "Currently enabled",
    devicesTransmitting: "Devices transmitting",
    devicesTransmittingHint: "of {{count}} registered devices",
    fleetOnline: "Fleet online",
    fleetOnlineHint: "Devices with an active signal",
  },

  table: {
    provider: "Provider",
    status: "Status",
    devices: "Vehicles",
    transmitting: "Success ratio",
    lastSync: "Last sync",
  },

  detail: {
    allProviders: "All providers",
    notFoundTitle: "Provider not found",
    notFoundDescription: "The provider you are looking for does not exist.",
    backToProviders: "Back to providers",
    added: "Added",
    updated: "Updated",

    stats: {
      devices: "Devices",
      devicesHint: "{{count}} transmitting now",
      fleetOnline: "Fleet online",
      fleetOnlineHint_one: "{{count}} device without signal",
      fleetOnlineHint_other: "{{count}} devices without signal",
      allReporting: "All devices reporting",
      lastSync: "Last sync",
      lastSyncHint: "Most recent device report",
    },

    events: {
      title: "Recent events",
      viewAll: "View all",
      empty: "No events recorded for this provider.",
    },

    devicesTable: {
      plate: "Plate",
      type: "Type",
      status: "Status",
      gpsDevice: "GPS device",
      speed: "Speed",
      lastSync: "Last sync",
      emptyTitle: "No devices",
      emptyDescription: "This provider has no registered devices.",
    },
  },
}
