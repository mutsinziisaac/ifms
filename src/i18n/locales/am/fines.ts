// Amharic (አማርኛ) — Compliance & Fines dashboard. Shape mirrors en/fines.ts.
export default {
  title: "ተገዢነትና ቅጣቶች",
  description:
    "በክትትል ስር ባለው ፍሊት ላይ የትራፊክ ቅጣቶችና ጥሰቶች — አይነት፣ ወጪ እና የክፍያ ሁኔታ።",
  addButton: "ቅጣት መዝግብ",

  stats: {
    total: "ቅጣቶች",
    totalHint: "ሁሉም የተመዘገቡ ቅጣቶች",
    totalCost: "ጠቅላላ ወጪ",
    totalCostHint: "የሁሉም ቅጣቶች ድምር",
    outstanding: "ያልተከፈለ",
    outstandingHint: "በመጠባበቅ ላይ + ክርክር ላይ",
    paid: "ተከፍሏል",
    paidHint: "ከ{{total}} ውስጥ {{count}} ተከፍሏል",
  },

  charts: {
    statusTitle: "በክፍያ ሁኔታ",
    statusSubtitle: "ተከፍሏል፣ በመጠባበቅ ላይ እና ክርክር ላይ",
    typeTitle: "በጥሰት አይነት",
    typeSubtitle: "በአይነት ጠቅላላ የቅጣት ዋጋ (ብር)",
    typeValueLabel: "ጠቅላላ (ብር)",
    centerLabel: "ቅጣቶች",
  },

  filters: {
    type: "ጥሰት",
    status: "ሁኔታ",
    entity: "አቅራቢ",
  },

  table: {
    searchPlaceholder: "በቲኬት፣ ሰሌዳ ወይም አሽከርካሪ ይፈልጉ…",
    ticket: "ቲኬት",
    date: "የተሰጠበት",
    vehicle: "ተሽከርካሪ",
    driver: "አሽከርካሪ",
    type: "ጥሰት",
    amount: "መጠን",
    status: "ሁኔታ",
    source: "ምንጭ",
    sourceEvent: "የተገናኘ ክስተት",
    actions: "እርምጃዎች",
    emptyTitle: "ምንም ቅጣት አልተገኘም",
    emptyDescription: "የተለየ ማጣሪያ ይሞክሩ፣ ወይም አዲስ ቅጣት ይመዝግቡ።",
  },

  form: {
    addTitle: "ቅጣት መዝግብ",
    editTitle: "ቅጣት አርትዕ",
    addDescription: "አዲስ የትራፊክ ቅጣት ወይም ጥሰት ይመዝግቡ።",
    editDescription: "ይህን የቅጣት መዝገብ ያዘምኑ።",
    add: "ቅጣት መዝግብ",
    save: "ለውጦችን አስቀምጥ",
    vehicle: "ተሽከርካሪ",
    selectVehicle: "ተሽከርካሪ ይምረጡ",
    driver: "አሽከርካሪ",
    noDriver: "— አሽከርካሪ የለም —",
    type: "የጥሰት አይነት",
    amount: "መጠን (ብር)",
    issuedAt: "የተሰጠበት ቀን",
    address: "አካባቢ",
    addressPlaceholder: "ለምሳሌ የአዋሽ ኬላ",
    status: "የክፍያ ሁኔታ",
    notes: "ማስታወሻዎች",
    notesPlaceholder: "አማራጭ ዝርዝር…",
  },

  actions: { edit: "አርትዕ", delete: "ሰርዝ", viewEvent: "ክስተት እይ" },

  delete: {
    title: "ቅጣት ይሰረዝ?",
    description: "ይህ ቅጣት {{ticket}}ን በቋሚነት ያስወግዳል። ይህ መመለስ አይቻልም።",
    confirm: "ቅጣት ሰርዝ",
  },

  toast: {
    added: "ለ{{plate}} ቅጣት ተመዝግቧል።",
    saved: "ቅጣት ተዘምኗል።",
    deleted: "ቅጣት ተሰርዟል።",
    requiredFields: "ተሽከርካሪ ይምረጡ እና አስፈላጊ መስኮችን ይሙሉ።",
    error: "የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
    nothingToExport: "ለመላክ ምንም ቅጣት የለም።",
    exported: "ቅጣቶች ተልከዋል።",
  },

  export: { csv: "CSV ላክ", excel: "Excel ላክ", pdf: "PDF ላክ" },
}
