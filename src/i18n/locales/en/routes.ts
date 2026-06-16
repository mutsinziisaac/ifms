// Routes feature: list/detail page, the route form dialog (with waypoint rows),
// and the assign-vehicles dialog. Shared terms live under common/enums/forms.
export default {
  title: "Routes",
  description: "Freight corridors and vehicle itineraries.",
  addRoute: "Add route",
  searchPlaceholder: "Search routes or stops…",
  active: "Active",
  inactive: "Inactive",

  empty: {
    noRoutesTitle: "No routes yet",
    noMatchTitle: "No matching routes",
    noRoutesDescription:
      "Create your first freight corridor to start monitoring itineraries.",
    noMatchDescription: "Try a different search term.",
  },

  list: {
    stops: "{{count}} stops",
    toggleActive: "Toggle route active",
    assignVehicles: "Assign vehicles",
    editRoute: "Edit route",
    deleteRoute: "Delete route",
  },

  detail: {
    distance: "Distance",
    vehicles: "Vehicles",
    waypoints: "Waypoints",
    assignedVehicles: "Assigned vehicles",
    noneAssigned: "No vehicles assigned to this corridor yet.",
  },

  form: {
    editTitle: "Edit route",
    addTitle: "Add route",
    editDescription: "Update the corridor itinerary and its waypoints.",
    addDescription:
      "Define a freight corridor as an ordered list of waypoints.",
    saveChanges: "Save changes",
    createRoute: "Create route",
    namePlaceholder: "Addis Ababa – Djibouti Mainline",
    descriptionPlaceholder:
      "Primary freight corridor serving the port of Djibouti.",
    activeHint:
      "Inactive routes stay on existing assignments but cannot take new vehicles.",
    waypoints: "Waypoints",
    stops: "{{count}} stops",
    stopNamePlaceholder: "Stop name",
    latPlaceholder: "Lat",
    lngPlaceholder: "Lng",
    addWaypoint: "Add waypoint",
    waypointName: "Waypoint {{index}} name",
    waypointLat: "Waypoint {{index}} latitude",
    waypointLng: "Waypoint {{index}} longitude",
    removeWaypoint: "Remove waypoint {{index}}",
  },

  assign: {
    title: "Assign vehicles",
    description: 'Select the vehicles that run the "{{name}}" corridor.',
    submitLabel: "Assign ({{count}})",
    searchPlaceholder: "Search by plate, model or entity…",
    deactivatedTitle: "Route deactivated",
    deactivatedDescription:
      "Deactivated routes remain effective for vehicles already assigned, but cannot be added to new itineraries. Reactivate the route to assign vehicles.",
    noVehiclesTitle: "No vehicles found",
    noVehiclesDescription: "Try a different search term.",
    onRoute: "On route",
    otherRoute: "Other route",
  },

  delete: {
    title: "Delete route",
    description:
      'Delete "{{name}}"? Vehicles on this corridor will be unassigned. This cannot be undone.',
    confirm: "Delete route",
  },

  toast: {
    activated: '"{{name}}" activated',
    deactivated: '"{{name}}" deactivated — existing assignments stay effective',
    created: 'Route "{{name}}" created',
    updated: 'Route "{{name}}" updated',
    deleted: 'Route "{{name}}" deleted',
    assigned_one: '{{count}} vehicle assigned to "{{name}}"',
    assigned_other: '{{count}} vehicles assigned to "{{name}}"',
    deactivatedReject:
      "This route is deactivated and cannot take new vehicle assignments",
    nameRequired: "Route name is required",
    waypointNameRequired: "Each waypoint needs a name",
    waypointInvalidCoords: 'Waypoint "{{name}}" has invalid coordinates',
    minWaypoints: "A route needs at least 2 waypoints",
  },
}
