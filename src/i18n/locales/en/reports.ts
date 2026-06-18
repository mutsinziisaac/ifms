// Reports & Analytics module: report-type/base selectors, the selection panel,
// export controls, table column headers and the preview. Enum labels reuse the
// shared `enums` namespace.
export default {
  title: "Reports & Analytics",
  description:
    "Generate Events and Geozone activity reports for selected vehicles over a date range, then export to PDF, Excel or CSV.",

  filtersTitle: "Report parameters",
  type: {
    label: "Report type",
    events: "Events report",
    geozones: "Geozones report",
  },
  dateFrom: "From",
  dateTo: "To",

  selection: {
    title: "Selection",
    searchVehicles: "Search vehicles…",
    selectAll: "Select all",
    selectedCount: "{{count}} selected",
    countShown: "{{count}} shown",
    noMatch: "No matches for “{{query}}”.",
    hintAll: "Leave empty to include every record.",
  },

  export: {
    pdf: "Export PDF",
    excel: "Export Excel",
    csv: "Export CSV",
    generatedAt: "Generated {{date}}",
    baseVehiclesAll: "Vehicles: all",
    baseVehicles: "Vehicles: {{count}} selected",
    dateRangeAll: "Date range: all dates",
    dateRange: "Date range: {{from}} → {{to}}",
    sheetEvents: "Events",
    sheetGeozones: "Geozones",
  },

  toast: {
    nothingToExport: "No rows to export for the current selection.",
    exported: "Report exported.",
  },

  columns: {
    event: "Event",
    condition: "Condition",
    severity: "Severity",
    startTime: "Start time",
    vehicle: "Vehicle reg.",
    location: "Location",
    coordinates: "Coordinates",
    status: "Status",
    geozone: "Geozone",
    entered: "Entered",
    exited: "Exited",
    dwell: "Dwell time",
  },

  preview: {
    rows: "{{count}} rows",
    emptyTitle: "No data for this report",
    emptyDescription: "Adjust the date range or selection and try again.",
  },
}
