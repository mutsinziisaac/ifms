// Events workspace + Event Rules page. Namespace "events" — t("events.title").
// Enum labels (type/status/severity/ruleType) come from enums.* — not redefined
// here. Generic actions/table chrome come from common.*.
export default {
  title: "Events",
  description:
    "Violation and activity events across the monitored fleet — review, escalate and close.",

  view: {
    listLabel: "List view",
    mapLabel: "Map view",
  },

  stats: {
    open: "Open",
    openHint: "Awaiting review",
    acknowledged: "Acknowledged",
    acknowledgedHint: "Under review",
    escalated: "Escalated",
    escalatedHint: "With a higher authority",
    closedToday: "Closed today",
    closedTodayHint: "Resolved in the last 24h",
  },

  filters: {
    allStatuses: "All statuses",
    allSeverities: "All severities",
    allTypes: "All types",
    allProviders: "All providers",
    allVehicles: "All vehicles",
  },

  table: {
    searchPlaceholder: "Search events…",
    severity: "Severity",
    status: "Status",
    event: "Event",
    provider: "Provider",
    vehicle: "Vehicle",
    geozone: "Geozone",
    when: "When",
    emptyTitle: "No events match",
    emptyDescription: "Adjust the filters or wait for the live feed.",
  },

  toast: {
    nothingToExport: "No events to export",
    exported_one: "Exported {{count}} event",
    exported_other: "Exported {{count}} events",
    allMarkedRead: "All events marked read",
  },

  detail: {
    vehicle: "Vehicle",
    provider: "Provider",
    geozone: "Geozone",
    location: "Location",
    timelineTitle: "Handling timeline",
    recorded: "Event recorded",
    acknowledged: "Acknowledged",
    awaitingReview: "Awaiting review",
    escalated: "Escalated",
    escalatedTo: "To {{target}} · {{at}}",
    closed: "Closed",
    openForHandling: "Open for handling",
    byAt: "{{by}} · {{at}}",
    resolutionNote: "Resolution note",
  },

  workflow: {
    acknowledge: "Acknowledge",
    escalate: "Escalate",
    closeEvent: "Close event",
    acknowledgeToast: "Event acknowledged",
    acknowledgeError: "Could not acknowledge",
    escalateToast: "Escalated to {{target}}",
    escalateError: "Could not escalate",
    closeToast: "Event closed",
    closeError: "Could not close",
    noteRequired: "A resolution note is required to close an event",
    escalateTitle: "Escalate event",
    escalateDescription:
      "Forward this event to a higher authority for handling.",
    escalateToLabel: "Escalate to",
    closeTitle: "Close event",
    closeDescription: "Record how this event was resolved. A note is required.",
    resolutionNoteLabel: "Resolution note",
    resolutionNotePlaceholder:
      "e.g. Driver contacted; warning issued and logged.",
  },

  rules: {
    title: "Event Rules",
    description:
      "Violation rules that generate events across the monitored fleet.",
    newGeozoneRule: "New geozone rule",

    fleetWide: {
      title: "Fleet-wide rules",
      description: "Apply to every monitored vehicle, independent of geozones.",
      active: "Active",
      inactive: "Inactive",
      thresholdLabel: "Threshold ({{unit}})",
      toggleAria: "Toggle {{name}} rule",
    },

    descriptions: {
      global_speeding:
        "Fires a speeding event when any vehicle exceeds this limit anywhere on the corridor.",
      idle: "Fires when a vehicle keeps its engine running while stationary beyond this duration.",
      no_signal:
        "Fires when a device stops transmitting for longer than this window.",
    },

    geozone: {
      title: "Geozone rules",
      description:
        "Entry, exit and zone speed rules — also editable per zone on the Geozones page.",
      emptyTitle: "No geozone rules",
      emptyDescription: "Create a rule to start generating geozone events.",
    },

    columns: {
      geozone: "Geozone",
      trigger: "Trigger",
      threshold: "Threshold",
      severity: "Severity",
      active: "Active",
    },

    toggleAria: "Toggle rule",
    deleteAria: "Delete rule",

    deleteTitle: "Delete rule?",
    deleteDescription:
      "The {{type}} rule for {{zone}} will stop generating events.",
    deleteFallbackZone: "this zone",

    toast: {
      created: "Rule created",
      updated: "Rule updated",
      deleted: "Rule deleted",
      saveError: "Could not save rule",
      updateError: "Could not update rule",
      deleteError: "Could not delete rule",
      invalidThreshold: "Enter a valid threshold",
      invalidSpeedLimit: "Enter a valid speed limit",
      chooseGeozone: "Choose a geozone for this rule",
    },

    form: {
      editTitle: "Edit geozone rule",
      createTitle: "New geozone rule",
      description: "Generates an event when a vehicle triggers this condition.",
      saveChanges: "Save changes",
      createRule: "Create rule",
      triggerLabel: "Trigger",
      geozoneLabel: "Geozone",
      geozonePlaceholder: "Choose a geozone",
      speedLimitLabel: "Speed limit (km/h)",
      severityLabel: "Severity",
      ruleActive: "Rule is active",
    },
  },

  export: {
    at: "At",
    severity: "Severity",
    event: "Event",
    status: "Status",
    message: "Message",
    vehicle: "Vehicle",
    provider: "Provider",
    geozone: "Geozone",
    acknowledgedBy: "Acknowledged by",
    acknowledgedAt: "Acknowledged at",
    escalatedTo: "Escalated to",
    escalatedAt: "Escalated at",
    closedBy: "Closed by",
    closedAt: "Closed at",
    resolutionNote: "Resolution note",
  },
}
