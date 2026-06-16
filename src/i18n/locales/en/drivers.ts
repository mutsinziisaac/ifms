// Drivers feature: list page, detail page, form/assign dialogs, safety panel.
// Namespace is "drivers" — t("drivers.title") maps to { title }. Generic
// actions/values live under common.*, enum labels under enums.*, shared form
// fields under forms.* — reused here rather than redefined.
export default {
  title: "Drivers",
  description: "Driver profiles, vehicle assignments and safety records.",
  addDriver: "Add driver",

  stats: {
    total: "Total drivers",
    active: "Active",
    assigned: "Assigned",
    unassigned: "Unassigned",
    expiring: "Licenses expiring",
    expiringHint: "within {{count}} days",
  },

  filters: {
    assignment: "Assignment",
    withAssignment: "With assignment",
    withoutAssignment: "Without assignment",
    status: "Status",
    entity: "Entity",
  },

  table: {
    searchPlaceholder: "Search name, license, phone…",
    name: "Name",
    entity: "Entity",
    license: "License",
    phone: "Phone",
    assignedVehicle: "Assigned vehicle",
    status: "Status",
    emptyTitle: "No drivers found",
    emptyDescription: "Adjust your filters or add a new driver to get started.",
  },

  license: {
    expiresIn: "Expires in {{count}}d",
    expiredAgo: "Expired {{count}}d ago",
    inDays: "in {{count}}d",
  },

  detail: {
    driver: "Driver",
    notFoundTitle: "Driver not found",
    notFoundDescription: "This driver may have been removed.",
    backToDrivers: "Back to drivers",
    subtitle: "{{license}} · Category {{category}}",
    assignVehicle: "Assign vehicle",

    profile: {
      title: "Profile",
      phone: "Phone",
      email: "Email",
      license: "License",
      licenseExpiry: "License expiry",
      entity: "Entity",
      hireDate: "Hire date",
      emergencyContact: "Emergency contact",
      notProvided: "Not provided",
    },

    safety: {
      title: "Safety record",
      outOf: "/ 100",
      excellent: "Excellent",
      fair: "Fair",
      needsAttention: "Needs attention",
      drivingEvents: "Driving events",
      harshBraking: "Harsh braking",
      harshAcceleration: "Harsh acceleration",
      speedingEvents: "Speeding events",
      assignedVehicle: "Assigned vehicle",
      noVehicle: "No vehicle assigned to this driver.",
    },

    deleteTitle: "Delete driver",
    deleteDescription:
      "Remove {{name}} from the registry? Any assigned vehicle will be unlinked. This cannot be undone.",
    deleteConfirm: "Delete driver",
  },

  form: {
    editTitle: "Edit driver",
    addTitle: "Add driver",
    editDescription: "Update this driver's profile and license details.",
    addDescription:
      "Register a new driver. Vehicle assignment is handled separately.",
    saveChanges: "Save changes",
    licenseNumber: "License number",
    category: "Category",
    expiry: "Expiry",
    hireDate: "Hire date",
    emergencyContact: "Emergency contact",
    emergencyPhone: "Emergency phone",
    emergencyContactPlaceholder: "Contact name",
    selectEntity: "Select entity",
  },

  assign: {
    title: "Assign vehicle",
    description: "Choose the vehicle {{name}} will operate.",
    saveAssignment: "Save assignment",
    vehicle: "Vehicle",
    selectVehicle: "Select a vehicle",
    hint: "Only vehicles without a driver are shown. Assigning here detaches any previous link automatically.",
  },

  toast: {
    removed: "Removed {{name}}.",
    deleteError: "Could not delete driver.",
    requiredFields: "First name, last name and license number are required.",
    saved: "Saved {{name}}.",
    saveError: "Could not save driver.",
    added: "Added {{name}}.",
    addError: "Could not add driver.",
    unassigned: "Unassigned vehicle from {{name}}.",
    assigned: "Assigned {{plate}} to {{name}}.",
    assignError: "Could not update assignment.",
    fallbackVehicle: "vehicle",
  },
}
