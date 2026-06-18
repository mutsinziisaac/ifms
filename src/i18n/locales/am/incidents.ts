// Amharic (አማርኛ) — Safety & Incident dashboard. Shape mirrors en/incidents.ts.
export default {
  title: "ደህንነትና አደጋዎች",
  description:
    "በክትትል ስር ባለው ፍሊት ላይ የአደጋ መዝገቦች — ክብደት፣ መንስኤ እና የጥገና/መድን ወጪ።",
  addButton: "አደጋ መዝግብ",

  stats: {
    total: "አደጋዎች",
    totalHint: "ሁሉም የተመዘገቡ አደጋዎች",
    major: "ከባድ አደጋዎች",
    majorHint: "ከፍተኛ ክብደት",
    casualties: "ጉዳተኞች",
    casualtiesHint: "የተጎዱ ሰዎች",
    repairCost: "የጥገና ወጪ",
    repairCostHint: "ጠቅላላ የተመዘገበ ጥገና",
    insurance: "የመድን ጥያቄዎች",
    insuranceHint: "ጠቅላላ የተጠየቀ",
  },

  charts: {
    severityTitle: "በክብደት",
    severitySubtitle: "የአደጋ ክብደት ስርጭት",
    rootCauseTitle: "በመንስኤ",
    rootCauseSubtitle: "አደጋዎችን የሚያስከትለው ምንድነው",
    incidentsValueLabel: "አደጋዎች",
    centerLabel: "አደጋዎች",
  },

  filters: {
    severity: "ክብደት",
    rootCause: "መንስኤ",
    entity: "አቅራቢ",
  },

  table: {
    searchPlaceholder: "በሰሌዳ ወይም ሪፖርት ቁ. ይፈልጉ…",
    date: "ቀን",
    vehicle: "ተሽከርካሪ",
    severity: "ክብደት",
    rootCause: "መንስኤ",
    casualties: "ጉዳተኞች",
    repairCost: "የጥገና ወጪ",
    location: "አካባቢ",
    actions: "እርምጃዎች",
    emptyTitle: "ምንም አደጋ አልተገኘም",
    emptyDescription: "የተለየ ማጣሪያ ይሞክሩ፣ ወይም አዲስ አደጋ ይመዝግቡ።",
  },

  form: {
    addTitle: "አደጋ መዝግብ",
    editTitle: "አደጋ አርትዕ",
    addDescription: "አዲስ የመኪና አደጋ ወይም የደህንነት ክስተት ይመዝግቡ።",
    editDescription: "ይህን የአደጋ መዝገብ ያዘምኑ።",
    add: "አደጋ መዝግብ",
    save: "ለውጦችን አስቀምጥ",
    vehicle: "ተሽከርካሪ",
    selectVehicle: "ተሽከርካሪ ይምረጡ",
    severity: "ክብደት",
    rootCause: "መንስኤ",
    occurredAt: "ቀንና ሰዓት",
    address: "አካባቢ",
    addressPlaceholder: "ለምሳሌ የአዳማ መዞሪያ፣ ኪሜ 78",
    casualties: "ጉዳተኞች",
    repairCost: "የጥገና ወጪ (ብር)",
    insuranceClaim: "የመድን ጥያቄ (ብር)",
    policeReport: "የፖሊስ ሪፖርት ቁ.",
    notes: "ማስታወሻዎች",
    notesPlaceholder: "አማራጭ ዝርዝር…",
  },

  actions: { edit: "አርትዕ", delete: "ሰርዝ" },

  delete: {
    title: "አደጋ ይሰረዝ?",
    description:
      "ይህ የ{{plate}} አደጋ መዝገብን በቋሚነት ያስወግዳል። ይህ መመለስ አይቻልም።",
    confirm: "አደጋ ሰርዝ",
  },

  toast: {
    added: "ለ{{plate}} አደጋ ተመዝግቧል።",
    saved: "አደጋ ተዘምኗል።",
    deleted: "አደጋ ተሰርዟል።",
    requiredFields: "ተሽከርካሪ ይምረጡ እና አስፈላጊ መስኮችን ይሙሉ።",
    error: "የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
    nothingToExport: "ለመላክ ምንም አደጋ የለም።",
    exported: "አደጋዎች ተልከዋል።",
  },

  export: { csv: "CSV ላክ", excel: "Excel ላክ", pdf: "PDF ላክ" },
}
