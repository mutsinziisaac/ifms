// Amharic (አማርኛ) — Reports & Analytics module. Shape mirrors en/reports.ts.
export default {
  title: "ሪፖርቶችና ትንታኔ",
  description:
    "ለተመረጡ ተሽከርካሪዎች ወይም አሽከርካሪዎች በተወሰነ የቀን ክልል የክስተት እና የጂኦ-ዞን እንቅስቃሴ ሪፖርቶችን ይፍጠሩ፣ ከዚያም ወደ PDF፣ Excel ወይም CSV ይላኩ።",

  filtersTitle: "የሪፖርት መለኪያዎች",
  type: {
    label: "የሪፖርት አይነት",
    events: "የክስተት ሪፖርት",
    geozones: "የጂኦ-ዞን ሪፖርት",
  },
  base: {
    label: "የሪፖርት መሰረት",
    vehicles: "ተሽከርካሪዎች",
    drivers: "አሽከርካሪዎች",
  },
  dateFrom: "ከ",
  dateTo: "እስከ",

  selection: {
    title: "ምርጫ",
    searchVehicles: "ተሽከርካሪዎችን ይፈልጉ…",
    searchDrivers: "አሽከርካሪዎችን ይፈልጉ…",
    selectAll: "ሁሉንም ይምረጡ",
    selectedCount: "{{count}} ተመርጧል",
    countShown: "{{count}} ይታያል",
    noMatch: "ለ“{{query}}” ምንም ግጥሚያ የለም።",
    hintAll: "ሁሉንም መዝገብ ለማካተት ባዶ ይተዉት።",
  },

  export: {
    pdf: "PDF ላክ",
    excel: "Excel ላክ",
    csv: "CSV ላክ",
    generatedAt: "የተፈጠረው {{date}}",
    baseVehiclesAll: "ተሽከርካሪዎች: ሁሉም",
    baseDriversAll: "አሽከርካሪዎች: ሁሉም",
    baseVehicles: "ተሽከርካሪዎች: {{count}} ተመርጧል",
    baseDrivers: "አሽከርካሪዎች: {{count}} ተመርጧል",
    dateRangeAll: "የቀን ክልል: ሁሉም ቀናት",
    dateRange: "የቀን ክልል: {{from}} → {{to}}",
    sheetEvents: "ክስተቶች",
    sheetGeozones: "ጂኦ-ዞኖች",
  },

  toast: {
    nothingToExport: "ለአሁኑ ምርጫ ለመላክ ምንም ረድፍ የለም።",
    exported: "ሪፖርት ተልኳል።",
  },

  columns: {
    event: "ክስተት",
    condition: "ሁኔታ",
    severity: "ክብደት",
    startTime: "የመጀመሪያ ሰዓት",
    vehicle: "የተሽከርካሪ ሰሌዳ",
    driver: "አሽከርካሪ",
    location: "አካባቢ",
    coordinates: "መጋጠሚያዎች",
    status: "ሁኔታ",
    geozone: "ጂኦ-ዞን",
    entered: "የገባበት",
    exited: "የወጣበት",
    dwell: "የቆይታ ጊዜ",
  },

  preview: {
    rows: "{{count}} ረድፎች",
    emptyTitle: "ለዚህ ሪፖርት ምንም መረጃ የለም",
    emptyDescription: "የቀን ክልሉን ወይም ምርጫውን አስተካክለው እንደገና ይሞክሩ።",
  },
}
