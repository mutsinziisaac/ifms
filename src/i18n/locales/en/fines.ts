// Compliance & Fines dashboard: KPI cards, status/type charts, the fines table
// and the create/edit form. Enum labels reuse `enums`.
export default {
  title: "Compliance & Fines",
  description:
    "Traffic fines and violations across the monitored fleet — type, cost and payment status.",
  addButton: "Record fine",

  stats: {
    total: "Fines",
    totalHint: "All recorded fines",
    totalCost: "Total cost",
    totalCostHint: "Sum of all fines",
    outstanding: "Outstanding",
    outstandingHint: "Pending + disputed",
    paid: "Paid",
    paidHint: "{{count}} of {{total}} settled",
  },

  charts: {
    statusTitle: "By payment status",
    statusSubtitle: "Paid, pending and disputed",
    typeTitle: "By violation type",
    typeSubtitle: "Total fine value (ETB) per type",
    typeValueLabel: "Total (ETB)",
    centerLabel: "fines",
  },

  filters: {
    type: "Violation",
    status: "Status",
    entity: "Provider",
  },

  table: {
    searchPlaceholder: "Search by ticket, plate or driver…",
    ticket: "Ticket",
    date: "Issued",
    vehicle: "Vehicle",
    driver: "Driver",
    type: "Violation",
    amount: "Amount",
    status: "Status",
    source: "Source",
    sourceEvent: "Linked event",
    actions: "Actions",
    emptyTitle: "No fines found",
    emptyDescription: "Try a different filter, or record a new fine.",
  },

  form: {
    addTitle: "Record fine",
    editTitle: "Edit fine",
    addDescription: "Record a new traffic fine or violation.",
    editDescription: "Update this fine record.",
    add: "Record fine",
    save: "Save changes",
    vehicle: "Vehicle",
    selectVehicle: "Select a vehicle",
    driver: "Driver",
    noDriver: "— No driver —",
    type: "Violation type",
    amount: "Amount (ETB)",
    issuedAt: "Date issued",
    address: "Location",
    addressPlaceholder: "e.g. Awash checkpoint",
    status: "Payment status",
    notes: "Notes",
    notesPlaceholder: "Optional context…",
  },

  actions: { edit: "Edit", delete: "Delete", viewEvent: "View event" },

  delete: {
    title: "Delete fine?",
    description:
      "This permanently removes fine {{ticket}}. This cannot be undone.",
    confirm: "Delete fine",
  },

  toast: {
    added: "Fine recorded for {{plate}}.",
    saved: "Fine updated.",
    deleted: "Fine deleted.",
    requiredFields: "Select a vehicle and fill in the required fields.",
    error: "Something went wrong. Please try again.",
    nothingToExport: "No fines to export.",
    exported: "Fines exported.",
  },

  export: { csv: "Export CSV", excel: "Export Excel", pdf: "Export PDF" },
}
