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
    location: "Location",
    when: "When",
    emptyTitle: "No events match",
    emptyDescription: "Adjust the filters or wait for the live feed.",
  },

  alertBanner: {
    message_one: "{{count}} critical alert needs attention",
    message_other: "{{count}} critical alerts need attention",
    action: "Review",
    dismiss: "Dismiss",
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
    route: "Route",
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
      "Triggers that watch the fleet for violations and raise alerts when they happen.",
    newRule: "New rule",

    targeted: {
      title: "Triggers",
      description:
        "Geozone and route triggers, optionally scoped to specific vehicles.",
      emptyTitle: "No triggers yet",
      emptyDescription: "Create a trigger to start raising alerts.",
    },

    columns: {
      name: "Trigger",
      scope: "Scope",
      vehicles: "Vehicles",
      threshold: "Threshold",
      severity: "Severity",
      notify: "Notify",
      active: "Active",
    },

    scopeFleet: "Fleet-wide",
    vehiclesAll: "All vehicles",
    vehiclesCount_one: "{{count}} vehicle",
    vehiclesCount_other: "{{count}} vehicles",
    notifyInAppOnly: "In-app only",

    toggleAria: "Toggle rule",
    deleteAria: "Delete rule",

    deleteTitle: "Delete rule?",
    deleteDescription: "The “{{name}}” trigger will stop raising alerts.",

    toast: {
      created: "Event rule created",
      updated: "Event rule updated",
      deleted: "Rule deleted",
      saveError: "Could not save the rule",
      updateError: "Could not update rule",
      deleteError: "Could not delete rule",
      invalidThreshold: "Enter a valid threshold",
      invalidSpeedLimit: "Enter a valid speed limit",
      invalidDeviation: "Enter a valid deviation distance",
      nameRequired: "Give the trigger a name",
      chooseGeozone: "Choose a geozone for this trigger",
      chooseRoute: "Choose a route for this trigger",
      chooseVehicles: "Select at least one vehicle",
      notFound: "That rule no longer exists",
    },

    wizard: {
      createTitle: "New event rule",
      editTitle: "Edit event rule",
      createDescription:
        "Define a violation to watch for and what should happen when it fires.",
      editDescription: "Update this trigger and what happens when it fires.",
      back: "Back",
      next: "Next",
      cancel: "Cancel",
      save: "Create rule",
      saveChanges: "Save changes",

      steps: {
        trigger: "Trigger",
        where: "Where",
        vehicles: "Vehicles",
        action: "Action",
      },

      step1: {
        title: "What should this trigger watch for?",
        description: "Pick the kind of violation that fires this alert.",
        nameLabel: "Trigger name",
        namePlaceholder: "e.g. Awash checkpoint speeding",
        locationGroup: "Location-based",
        fleetGroup: "Fleet-wide",
      },

      step2: {
        title: "Where does it apply?",
        geozoneLabel: "Geozone",
        geozonePlaceholder: "Choose a geozone",
        routeLabel: "Route",
        routePlaceholder: "Choose a route",
        speedLimitLabel: "Speed limit (km/h)",
        deviationLabel: "Deviation distance (m)",
        idleLabel: "Idle threshold (min)",
        noSignalLabel: "Signal timeout (min)",
        fleetSpeedLabel: "Fleet speed limit (km/h)",
        fleetNote:
          "This trigger applies across the whole corridor — no area to pick.",
        previewTitle: "Preview",
        previewEmpty: "Pick an area to preview it on the map.",
      },

      step3: {
        title: "Which vehicles does it watch?",
        description:
          "Watch the whole fleet, or limit the trigger to specific vehicles.",
        allLabel: "All vehicles",
        allHint: "Every monitored vehicle is watched.",
        specificLabel: "Specific vehicles",
        specificHint: "Only the vehicles you pick are watched.",
      },

      step4: {
        title: "Alert & notifications",
        description: "Set the alert severity and who gets notified.",
        severityLabel: "Severity",
        notifyTitle: "Notifications",
        inApp: "In-app alert",
        inAppHint: "Always on — shows in the Events feed.",
        email: "Email",
        emailPlaceholder: "ops@example.gov.et",
        sms: "SMS",
        smsPlaceholder: "+251…",
        reviewTitle: "Review",
        reviewType: "Trigger",
        reviewScope: "Scope",
        reviewVehicles: "Vehicles",
        reviewSeverity: "Severity",
        reviewNotify: "Notify",
      },

      triggerDescriptions: {
        entry: "Fires when a vehicle enters the geozone.",
        exit: "Fires when a vehicle leaves the geozone.",
        speeding: "Fires when a vehicle speeds inside the geozone.",
        route_deviation: "Fires when a vehicle strays off its route corridor.",
        global_speeding:
          "Fires when a vehicle exceeds the fleet speed limit anywhere.",
        idle: "Fires when a vehicle idles beyond the threshold.",
        no_signal:
          "Fires when a device stops transmitting beyond the threshold.",
        ignition: "Fires on a vehicle ignition state change.",
      },
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
