// Overview dashboard: header, KPI cards, corridor stats, fleet donut, events feed.
export default {
  title: "Overview",
  description: "Real-time visibility across the monitored fleet.",
  lastUpdated: "Last updated",

  kpi: {
    movingNow: "Moving now",
    ofTracked: "of {{count}} tracked",
    averageSpeed: "Average speed",
    liveCorridorAverage: "Live corridor average",
    idling: "Idling",
    engineOnStationary: "Engine on, stationary",
    eventsToday: "Events today",
    last24Hours: "Last 24 hours",
  },

  corridor: {
    title: "Corridor overview",
    subtitle: "Addis Ababa – Djibouti",
    monitoredLength: "Monitored corridor length",
    averageFleetSpeed: "Average fleet speed",
    vehiclesOnRoutes: "Vehicles on corridor routes",
    activeRoutes: "Active routes",
    activeGeozones: "Active geozones",
    operatingEntities: "Operating entities",
    ofCount: "{{count}} of {{total}}",
  },

  fleetStatus: {
    title: "Fleet status",
    subtitle: "Live distribution across the fleet",
    centerLabel: "Vehicles",
  },

  liveFleet: {
    title: "Live fleet",
    open: "Open live map",
    pageTitle: "Live fleet map",
    pageDescription:
      "Track every monitored vehicle in real time, or switch to the table for a sortable breakdown.",
    tabMap: "Map",
    tabTable: "Table",
  },

  events: {
    title: "Recent events",
    viewAll: "View all",
    emptyTitle: "No events",
    emptyDescription: "The fleet is operating within all configured rules.",
  },
}
