// Providers feature: list page (stat cards, provider table) and detail page
// (lifecycle row, device stats, recent events, per-device table). Provider data
// comes from the live `/providers` endpoint — identity + lifecycle only. Shared
// terms (actions, table chrome, enum labels, form labels) live under
// common/enums/forms.
export default {
  title: "Providers",
  description:
    "Government institutions transmitting device data to the MoTL platform.",
  searchPlaceholder: "Search providers…",
  emptyTitle: "No providers found",
  emptyDescription: "Try a different search.",
  active: "Active",
  inactive: "Inactive",

  stats: {
    providers: "Providers",
    providersHint: "Registered with the platform",
    activeProviders: "Active providers",
    activeProvidersHint: "Currently enabled",
    vehiclesSubmitted: "Vehicles submitted",
    vehiclesSubmittedHint: "{{count}} verified in the ITMS registry",
    unverified: "Unverified",
    unverifiedHint: "{{count}} not found in the registry",
  },

  table: {
    provider: "Provider",
    status: "Status",
    vehicles: "Vehicles",
    verified: "Verified",
    unverified: "Unverified",
    notFound: "Not found",
  },

  detail: {
    allProviders: "All providers",
    notFoundTitle: "Provider not found",
    notFoundDescription: "The provider you are looking for does not exist.",
    backToProviders: "Back to providers",
    added: "Added",
    updated: "Updated",

    stats: {
      submitted: "Vehicles submitted",
      submittedHint: "Total registered with the provider",
      verified: "Verified",
      verifiedHint: "Matched in the ITMS registry",
      unverified: "Unverified",
      unverifiedHint: "Awaiting verification",
      notFound: "Not found",
      notFoundHint: "No ITMS registry match",
    },

    events: {
      title: "Recent events",
      viewAll: "View all",
      empty: "No events recorded for this provider.",
    },

    fleet: {
      searchPlaceholder: "Search plate or device IMEI…",
      plate: "Plate",
      verification: "Verification",
      status: "Status",
      speed: "Speed",
      heading: "Heading",
      ignition: "Ignition",
      ignitionOn: "On",
      ignitionOff: "Off",
      odometer: "Odometer",
      recorded: "Last report",
      payload: "JSON",
      emptyTitle: "No vehicles",
      emptyDescription: "This provider has no vehicles transmitting positions.",
    },

    payload: {
      view: "View raw JSON",
      title: "Raw position payload",
      description: "The latest position report for {{plate}}.",
      copy: "Copy JSON",
      copied: "Payload copied to clipboard",
      copyFailed: "Could not copy payload",
    },
  },
}
