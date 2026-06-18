// Safety & Incident dashboard: KPI cards, severity/root-cause charts, the
// incident table and the create/edit form. Enum labels reuse `enums`.
export default {
  title: "Safety & Incidents",
  description:
    "Accident and incident records across the monitored fleet — severity, root cause and repair/insurance cost.",
  addButton: "Log incident",

  stats: {
    total: "Incidents",
    totalHint: "All recorded accidents",
    major: "Major incidents",
    majorHint: "Highest severity",
    casualties: "Casualties",
    casualtiesHint: "People affected",
    repairCost: "Repair cost",
    repairCostHint: "Total recorded repairs",
    insurance: "Insurance claims",
    insuranceHint: "Total claimed",
  },

  charts: {
    severityTitle: "By severity",
    severitySubtitle: "Distribution of incident severity",
    rootCauseTitle: "By root cause",
    rootCauseSubtitle: "What is driving incidents",
    incidentsValueLabel: "Incidents",
    centerLabel: "incidents",
  },

  filters: {
    severity: "Severity",
    rootCause: "Root cause",
    entity: "Provider",
  },

  table: {
    searchPlaceholder: "Search by plate or report no…",
    date: "Date",
    vehicle: "Vehicle",
    severity: "Severity",
    rootCause: "Root cause",
    casualties: "Casualties",
    repairCost: "Repair cost",
    location: "Location",
    actions: "Actions",
    emptyTitle: "No incidents found",
    emptyDescription: "Try a different filter, or log a new incident.",
  },

  form: {
    addTitle: "Log incident",
    editTitle: "Edit incident",
    addDescription: "Record a new accident or safety incident.",
    editDescription: "Update this incident record.",
    add: "Log incident",
    save: "Save changes",
    vehicle: "Vehicle",
    selectVehicle: "Select a vehicle",
    severity: "Severity",
    rootCause: "Root cause",
    occurredAt: "Date & time",
    address: "Location",
    addressPlaceholder: "e.g. Adama bypass, km 78",
    casualties: "Casualties",
    repairCost: "Repair cost (ETB)",
    insuranceClaim: "Insurance claim (ETB)",
    policeReport: "Police report no.",
    notes: "Notes",
    notesPlaceholder: "Optional context…",
  },

  actions: { edit: "Edit", delete: "Delete" },

  delete: {
    title: "Delete incident?",
    description:
      "This permanently removes the incident record for {{plate}}. This cannot be undone.",
    confirm: "Delete incident",
  },

  toast: {
    added: "Incident logged for {{plate}}.",
    saved: "Incident updated.",
    deleted: "Incident deleted.",
    requiredFields: "Select a vehicle and fill in the required fields.",
    error: "Something went wrong. Please try again.",
    nothingToExport: "No incidents to export.",
    exported: "Incidents exported.",
  },

  export: { csv: "Export CSV", excel: "Export Excel", pdf: "Export PDF" },
}
