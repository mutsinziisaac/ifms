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
    noRoutesDescription:
      "መርሐ ጉዞዎችን መከታተል ለመጀመር የመጀመሪያውን የጭነት ኮሪደር በካርታ ላይ ይሳሉ።",
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
    from: "ከ",
    to: "ወደ",
  },

  map: {
    drawHint: "ነጥቦችን ለመጨመር ካርታውን ጠቅ ያድርጉ",
    undo: "ቀልብስ",
    clear: "አጽዳ",
  },

  editor: {
    createTitle: "መስመር ፍጠር",
    editTitle: "መስመር አርትዕ",
    createDescription: "ኮሪደሩን በካርታ ላይ ይሳሉና ዝርዝሮቹን ይጨምሩ።",
    editDescription: "ኮሪደሩንና ዝርዝሮቹን ያስተካክሉ።",
    plotHint: "ኮሪደሩን ለመሳል ካርታውን ጠቅ ያድርጉ (ቢያንስ 2 ነጥቦች)።",
  },

  form: {
    editTitle: "መስመር አርትዕ",
    addTitle: "አዲስ መስመር",
    editDescription: "የኮሪደሩን ዝርዝሮችና መነሻ/መድረሻ ያዘምኑ።",
    addDescription: "በካርታ ላይ የሳሉትን ኮሪደር ይሰይሙና መነሻ/መድረሻውን ያስቀምጡ።",
    saveChanges: "ለውጦችን አስቀምጥ",
    createRoute: "መስመር ፍጠር",
    namePlaceholder: "አዲስ አበባ – ጅቡቲ ዋና መስመር",
    descriptionPlaceholder: "የጅቡቲን ወደብ የሚያገለግል ዋና የጭነት ኮሪደር።",
    activeHint:
      "ንቁ ያልሆኑ መስመሮች ቀደም ሲል በተመደቡት ላይ ይቆያሉ ነገር ግን አዲስ ተሽከርካሪዎችን መቀበል አይችሉም።",
    startAddress: "የመነሻ አድራሻ",
    endAddress: "የመድረሻ አድራሻ",
    startAddressPlaceholder: "ቃሊቲ ደረቅ ወደብ፣ አዲስ አበባ",
    endAddressPlaceholder: "አዳማ ሎጂስቲክስ ማዕከል፣ አዳማ",
    plottedRoute: "የተሳለ መስመር",
    points: "{{count}} ነጥቦች",
    noPath: "እስካሁን የተሳለ መስመር የለም",
    replot: "በካርታ ላይ እንደገና ሳል",
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
    pathRequired: "በመጀመሪያ መስመሩን በካርታ ላይ ይሳሉ",
  },
}
