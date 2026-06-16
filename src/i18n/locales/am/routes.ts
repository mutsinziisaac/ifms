// Amharic (አማርኛ) — Routes feature. Shape mirrors en/routes.ts exactly.
export default {
  title: "መስመሮች",
  description: "የጭነት ኮሪደሮችና የተሽከርካሪ መርሐ ጉዞዎች።",
  addRoute: "አዲስ መስመር",
  searchPlaceholder: "መስመሮችን ወይም ማቆሚያዎችን ፈልግ…",
  active: "ንቁ",
  inactive: "ንቁ ያልሆነ",

  empty: {
    noRoutesTitle: "እስካሁን መስመር የለም",
    noMatchTitle: "ተመሳሳይ መስመር አልተገኘም",
    noRoutesDescription: "መርሐ ጉዞዎችን መከታተል ለመጀመር የመጀመሪያውን የጭነት ኮሪደር ይፍጠሩ።",
    noMatchDescription: "ሌላ የፍለጋ ቃል ይሞክሩ።",
  },

  list: {
    stops: "{{count}} ማቆሚያዎች",
    toggleActive: "የመስመር ንቁነትን ቀይር",
    assignVehicles: "ተሽከርካሪዎችን መድብ",
    editRoute: "መስመር አርትዕ",
    deleteRoute: "መስመር ሰርዝ",
  },

  detail: {
    distance: "ርቀት",
    vehicles: "ተሽከርካሪዎች",
    waypoints: "መንገድ ነጥቦች",
    assignedVehicles: "የተመደቡ ተሽከርካሪዎች",
    noneAssigned: "እስካሁን በዚህ ኮሪደር ላይ የተመደበ ተሽከርካሪ የለም።",
  },

  form: {
    editTitle: "መስመር አርትዕ",
    addTitle: "አዲስ መስመር",
    editDescription: "የኮሪደሩን መርሐ ጉዞና የመንገድ ነጥቦቹን ያዘምኑ።",
    addDescription: "የጭነት ኮሪደርን እንደ ቅደም ተከተል ያለው የመንገድ ነጥቦች ዝርዝር ይግለጹ።",
    saveChanges: "ለውጦችን አስቀምጥ",
    createRoute: "መስመር ፍጠር",
    namePlaceholder: "አዲስ አበባ – ጅቡቲ ዋና መስመር",
    descriptionPlaceholder: "የጅቡቲን ወደብ የሚያገለግል ዋና የጭነት ኮሪደር።",
    activeHint:
      "ንቁ ያልሆኑ መስመሮች ቀደም ሲል በተመደቡት ላይ ይቆያሉ ነገር ግን አዲስ ተሽከርካሪዎችን መቀበል አይችሉም።",
    waypoints: "መንገድ ነጥቦች",
    stops: "{{count}} ማቆሚያዎች",
    stopNamePlaceholder: "የማቆሚያ ስም",
    latPlaceholder: "ኬክሮስ", // review: Lat (latitude)
    lngPlaceholder: "ኬንትሮስ", // review: Lng (longitude)
    addWaypoint: "መንገድ ነጥብ ጨምር",
    waypointName: "የመንገድ ነጥብ {{index}} ስም",
    waypointLat: "የመንገድ ነጥብ {{index}} ኬክሮስ", // review: latitude
    waypointLng: "የመንገድ ነጥብ {{index}} ኬንትሮስ", // review: longitude
    removeWaypoint: "መንገድ ነጥብ {{index}} አስወግድ",
  },

  assign: {
    title: "ተሽከርካሪዎችን መድብ",
    description: 'የ"{{name}}" ኮሪደርን የሚሄዱ ተሽከርካሪዎችን ይምረጡ።',
    submitLabel: "መድብ ({{count}})",
    searchPlaceholder: "በታርጋ፣ በሞዴል ወይም በተቋም ፈልግ…",
    deactivatedTitle: "መስመር ተቦዝኗል",
    deactivatedDescription:
      "የተቦዘኑ መስመሮች ቀደም ሲል ለተመደቡ ተሽከርካሪዎች ተግባራዊ ሆነው ይቆያሉ፣ ነገር ግን ወደ አዲስ መርሐ ጉዞዎች ሊጨመሩ አይችሉም። ተሽከርካሪዎችን ለመመደብ መስመሩን እንደገና ያንቁ።",
    noVehiclesTitle: "ምንም ተሽከርካሪ አልተገኘም",
    noVehiclesDescription: "ሌላ የፍለጋ ቃል ይሞክሩ።",
    onRoute: "በመስመሩ ላይ",
    otherRoute: "ሌላ መስመር",
  },

  delete: {
    title: "መስመር ሰርዝ",
    description:
      '"{{name}}"ን ይሰረዝ? በዚህ ኮሪደር ላይ ያሉ ተሽከርካሪዎች ከመመደብ ይነሳሉ። ይህ መቀልበስ አይቻልም።',
    confirm: "መስመር ሰርዝ",
  },

  toast: {
    activated: '"{{name}}" ነቅቷል',
    deactivated: '"{{name}}" ተቦዝኗል — ያሉ ምድቦች ተግባራዊ ሆነው ይቆያሉ',
    created: '"{{name}}" መስመር ተፈጥሯል',
    updated: '"{{name}}" መስመር ተዘምኗል',
    deleted: '"{{name}}" መስመር ተሰርዟል',
    assigned_one: '{{count}} ተሽከርካሪ ወደ "{{name}}" ተመድቧል',
    assigned_other: '{{count}} ተሽከርካሪዎች ወደ "{{name}}" ተመድበዋል',
    deactivatedReject: "ይህ መስመር ተቦዝኗል እና አዲስ የተሽከርካሪ ምደባ መቀበል አይችልም",
    nameRequired: "የመስመር ስም ያስፈልጋል",
    waypointNameRequired: "እያንዳንዱ መንገድ ነጥብ ስም ያስፈልገዋል",
    waypointInvalidCoords: 'የመንገድ ነጥብ "{{name}}" የተሳሳተ መጋጠሚያዎች አሉት',
    minWaypoints: "መስመር ቢያንስ 2 መንገድ ነጥቦች ያስፈልጉታል",
  },
}
