// Routes feature: list/detail page, the route form dialog (corridor plotted on
// the map + start/end addresses), and the assign-vehicles dialog. Shared terms
// live under common/enums/forms.
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
      "Plot your first freight corridor on the map to start monitoring itineraries.",
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
    from: "From",
    to: "To",
  },

  map: {
    drawHint: "Click the map to add points",
    undo: "Undo",
    clear: "Clear",
  },

  editor: {
    createTitle: "Create route",
    editTitle: "Edit route",
    createDescription: "Plot the corridor on the map and add its details.",
    editDescription: "Adjust the corridor and its details.",
    plotHint: "Click the map to plot the corridor (at least 2 points).",
  },

  form: {
    editTitle: "Edit route",
    addTitle: "Add route",
    editDescription: "Update the corridor details and its endpoints.",
    addDescription:
      "Name the corridor you plotted on the map and set its endpoints.",
    saveChanges: "Save changes",
    createRoute: "Create route",
    namePlaceholder: "Addis Ababa – Djibouti Mainline",
    descriptionPlaceholder:
      "Primary freight corridor serving the port of Djibouti.",
    activeHint:
      "Inactive routes stay on existing assignments but cannot take new vehicles.",
    startAddress: "Start address",
    endAddress: "End address",
    startAddressPlaceholder: "Kality Dry Port, Addis Ababa",
    endAddressPlaceholder: "Adama Logistics Hub, Adama",
    plottedRoute: "Plotted route",
    points: "{{count}} points",
    noPath: "No route plotted yet",
    replot: "Re-plot on map",
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
    pathRequired: "Plot the route on the map first",
  },
}
