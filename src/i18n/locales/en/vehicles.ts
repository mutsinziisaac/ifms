// Fleet (vehicles) feature: list page, detail page, form dialog, and the
// per-vehicle cards (live status, events, map, travel history, report export).
// Shared terms live under common/enums/forms.
export default {
  title: "Fleet",
  description: "Vehicles operated by monitored entities across the corridor.",
  addVehicle: "Add vehicle",
  searchPlaceholder: "Search plate, model or entity…",
  searchByPlateProvider: "Search plate, provider or ID…",
  emptyTitle: "No vehicles found",
  emptyDescription: "Try adjusting your search or filters.",

  stats: {
    total: "Total vehicles",
    verificationFailed: "Verification failed",
    moving: "Moving",
    idling: "Idling",
    stopped: "Stopped",
    noSignal: "No signal",
    entitiesMonitored: "Entities monitored",
    inQueue: "In verification queue",
    unverified: "Unverified",
    providers: "Providers",
  },

  filters: {
    status: "Status",
    type: "Type",
    entity: "Entity",
    region: "Region",
    gps: "GPS",
    verification: "Verification",
  },

  table: {
    plate: "Plate",
    entity: "Entity",
    status: "Status",
    verification: "Verification",
    speed: "Speed",
    lastSync: "Last sync",
    region: "Region",
    provider: "Provider",
    externalId: "External ID",
    registryStatus: "Registry",
    lastUpdated: "Last updated",
  },

  form: {
    editTitle: "Edit vehicle",
    addTitle: "Add vehicle",
    editDescription:
      "Update the registration and monitoring details for this vehicle.",
    addDescription: "Register a new vehicle operated by a monitored entity.",
    saveChanges: "Save changes",
    plateNumber: "Plate number",
    platePlaceholder: "3-45821 ET",
    descriptionPlaceholder: "Sinotruk Howo A7 dry cargo",
    selectEntity: "Select entity",
    assignedRoute: "Assigned route",
    noRoute: "No route",
  },

  toast: {
    created: "Vehicle {{plate}} added",
    updated: "Vehicle {{plate}} updated",
    deleted: "Vehicle {{plate}} deleted",
    createFailed: "Failed to add vehicle",
    updateFailed: "Failed to update vehicle",
    deleteFailed: "Failed to delete vehicle",
    verificationChanged: "{{plate}} verification: {{status}}",
  },

  detail: {
    notFoundTitle: "Vehicle not found",
    notFoundDescription: "This vehicle may have been removed from the fleet.",
    backToFleet: "Back to fleet",
    deleteTitle: "Delete vehicle",
    deleteDescription:
      "Permanently remove {{plate}} from the fleet? This cannot be undone.",
    deleteConfirm: "Delete vehicle",

    identity: {
      entityFallback: "—",
    },

    map: {
      title: "Live map",
      follow: "Follow",
      shareLocation: "Share location",
      locationCopied: "Location copied to clipboard",
      copyFailed: "Could not copy location",
      synced: "Synced",
    },

    live: {
      title: "Live status",
      status: "Status",
      location: "Location",
      route: "Route",
      coordinates: "Coordinates",
      speed: "Speed",
      odometer: "Odometer",
      lastSync: "Last sync",
      fuelLevel: "Fuel level",
      onCorridor: "On the corridor",
    },

    events: {
      title: "Recent events",
      empty: "No geozone, speeding or signal events recorded.",
    },

    travel: {
      title: "Travel history",
      emptyTitle: "No trip history",
      emptyDescription:
        "Completed trips for this vehicle will appear here for playback.",
      colWhen: "When",
      colTrip: "Trip",
      colDistance: "Distance",
      playbackTitle: "Trip playback",
      closePlayback: "Close playback",
    },

    report: {
      title: "Reports",
      subtitle: "Events & travel history (CSV / Excel)",
      eventsCsv: "Events (CSV)",
      travelCsv: "Travel history (CSV)",
      noEvents: "No events to export for this vehicle",
      noTravel: "No travel history to export for this vehicle",
      eventsExported: "Events report exported",
      travelExported: "Travel history exported",
      eventHeaders: {
        severity: "Severity",
        event: "Event",
        status: "Status",
        message: "Message",
        geozone: "Geozone",
        at: "At",
      },
      travelHeaders: {
        start: "Start",
        end: "End",
        from: "From",
        to: "To",
        distance: "Distance (km)",
        avgSpeed: "Avg speed (km/h)",
        maxSpeed: "Max speed (km/h)",
      },
    },
  },
}
