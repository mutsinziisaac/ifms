// Providers feature: list page (stat cards, provider table), detail page
// (contact row, device stats, transmission activity, recent events, per-device
// telemetry table) and the category badge. Shared terms (actions, table chrome,
// enum labels, form labels) live under common/enums/forms.
export default {
  title: "Providers",
  description:
    "Government ministries and institutions transmitting device data to the MoTL platform.",
  searchPlaceholder: "Search providers…",
  emptyTitle: "No providers found",
  emptyDescription: "Try a different search.",

  stats: {
    providers: "Providers",
    providersHint: "Ministries, agencies & enterprises",
    devicesTransmitting: "Devices transmitting",
    devicesTransmittingHint: "of {{count}} registered devices",
    fleetOnline: "Fleet online",
    fleetOnlineHint: "Devices with an active signal",
    messagesReceived: "Messages received",
    messagesReceivedHint: "Position reports this session",
  },

  table: {
    provider: "Provider",
    type: "Type",
    region: "Region",
    devices: "Devices",
    transmitting: "Transmitting",
    lastSync: "Last sync",
    messages: "Messages",
    activity: "Activity",
  },

  detail: {
    allProviders: "All providers",
    notFoundTitle: "Provider not found",
    notFoundDescription: "The provider you are looking for does not exist.",
    backToProviders: "Back to providers",

    stats: {
      devices: "Devices",
      devicesHint: "{{count}} transmitting now",
      fleetOnline: "Fleet online",
      fleetOnlineHint_one: "{{count}} device without signal",
      fleetOnlineHint_other: "{{count}} devices without signal",
      allReporting: "All devices reporting",
      lastSync: "Last sync",
      lastSyncHint: "Most recent device report",
      messagesReceived: "Messages received",
      messagesReceivedHint: "Position reports this session",
    },

    transmission: {
      title: "Transmission activity",
      caption: "Devices reporting per update cycle — live feed.",
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
