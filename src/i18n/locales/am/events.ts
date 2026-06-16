// Amharic (አማርኛ) — Events workspace + Event Rules page. Shape mirrors
// en/events.ts (typed as typeof en). Same keys, nesting and plural suffixes.
export default {
  title: "ክስተቶች",
  description:
    "በክትትል ስር ባለው ፍሊት ላይ የጥሰት እና የእንቅስቃሴ ክስተቶች — ይገምግሙ፣ ለበላይ ያሳውቁ እና ይዝጉ።",

  view: {
    listLabel: "የዝርዝር እይታ",
    mapLabel: "የካርታ እይታ",
  },

  stats: {
    open: "ክፍት",
    openHint: "ግምገማ በመጠበቅ ላይ",
    acknowledged: "ታውቋል",
    acknowledgedHint: "በግምገማ ላይ",
    escalated: "ለበላይ ተላልፏል",
    escalatedHint: "ከበላይ ባለስልጣን ጋር", // review: "With a higher authority"
    closedToday: "ዛሬ የተዘጉ",
    closedTodayHint: "ባለፉት 24 ሰዓታት የተፈቱ",
  },

  filters: {
    allStatuses: "ሁሉም ሁኔታዎች",
    allSeverities: "ሁሉም የክብደት ደረጃዎች",
    allTypes: "ሁሉም ዓይነቶች",
    allProviders: "ሁሉም አቅራቢዎች",
    allVehicles: "ሁሉም ተሽከርካሪዎች",
  },

  table: {
    searchPlaceholder: "ክስተቶችን ፈልግ…",
    severity: "የክብደት ደረጃ",
    status: "ሁኔታ",
    event: "ክስተት",
    provider: "አቅራቢ",
    vehicle: "ተሽከርካሪ",
    geozone: "ጂኦ ዞን",
    when: "መቼ",
    emptyTitle: "ምንም ክስተት አይዛመድም", // review: "No events match"
    emptyDescription: "ማጣሪያዎቹን ያስተካክሉ ወይም የቀጥታ ምግቡን ይጠብቁ።",
  },

  toast: {
    nothingToExport: "የሚላክ ክስተት የለም",
    exported_one: "{{count}} ክስተት ተልኳል",
    exported_other: "{{count}} ክስተቶች ተልከዋል",
    allMarkedRead: "ሁሉም ክስተቶች እንደተነበቡ ምልክት ተደርጓል",
  },

  detail: {
    vehicle: "ተሽከርካሪ",
    provider: "አቅራቢ",
    geozone: "ጂኦ ዞን",
    location: "አካባቢ", // review: "Location"
    timelineTitle: "የአያያዝ የጊዜ ሰሌዳ", // review: "Handling timeline"
    recorded: "ክስተቱ ተመዝግቧል",
    acknowledged: "ታውቋል",
    awaitingReview: "ግምገማ በመጠበቅ ላይ",
    escalated: "ለበላይ ተላልፏል",
    escalatedTo: "ወደ {{target}} · {{at}}",
    closed: "ተዘግቷል",
    openForHandling: "ለአያያዝ ክፍት",
    byAt: "{{by}} · {{at}}",
    resolutionNote: "የመፍትሄ ማስታወሻ", // review: "Resolution note"
  },

  workflow: {
    acknowledge: "እወቅ",
    escalate: "ለበላይ አሳውቅ",
    closeEvent: "ክስተቱን ዝጋ",
    acknowledgeToast: "ክስተቱ ታውቋል",
    acknowledgeError: "ማወቅ አልተቻለም",
    escalateToast: "ወደ {{target}} ተላልፏል",
    escalateError: "ለበላይ ማሳወቅ አልተቻለም",
    closeToast: "ክስተቱ ተዘግቷል",
    closeError: "መዝጋት አልተቻለም",
    noteRequired: "ክስተት ለመዝጋት የመፍትሄ ማስታወሻ ያስፈልጋል",
    escalateTitle: "ክስተቱን ለበላይ አሳውቅ",
    escalateDescription: "ይህን ክስተት ለአያያዝ ወደ ከበላይ ባለስልጣን አስተላልፍ።",
    escalateToLabel: "ለበላይ አሳውቅ ለ",
    closeTitle: "ክስተቱን ዝጋ",
    closeDescription: "ይህ ክስተት እንዴት እንደተፈታ መዝግብ። ማስታወሻ ያስፈልጋል።",
    resolutionNoteLabel: "የመፍትሄ ማስታወሻ",
    resolutionNotePlaceholder: "ለምሳሌ አሽከርካሪው ተገናኝቷል፤ ማስጠንቀቂያ ተሰጥቶ ተመዝግቧል።",
  },

  rules: {
    title: "የክስተት ህጎች",
    description: "በክትትል ስር ባለው ፍሊት ላይ ክስተቶችን የሚያመነጩ የጥሰት ህጎች።",
    newGeozoneRule: "አዲስ የጂኦ ዞን ህግ",

    fleetWide: {
      title: "ፍሊት-አቀፍ ህጎች",
      description: "ከጂኦ ዞኖች ነጻ ሆነው በክትትል ስር ላሉ ሁሉም ተሽከርካሪዎች ይተገበራሉ።",
      active: "ንቁ",
      inactive: "ንቁ ያልሆነ",
      thresholdLabel: "ገደብ ({{unit}})",
      toggleAria: "የ{{name}} ህግን ቀይር",
    },

    descriptions: {
      global_speeding:
        "ማንኛውም ተሽከርካሪ በኮሪደሩ በማንኛውም ቦታ ይህን ገደብ ሲያልፍ የፍጥነት ክስተት ያስነሳል።",
      idle: "ተሽከርካሪ ቆሞ ከዚህ ቆይታ በላይ ሞተሩን ሲያሄድ ያስነሳል።",
      no_signal: "መሳሪያ ከዚህ ጊዜ ክፍተት በላይ መላክ ሲያቆም ያስነሳል።",
    },

    geozone: {
      title: "የጂኦ ዞን ህጎች",
      description:
        "የመግቢያ፣ የመውጫ እና የዞን ፍጥነት ህጎች — በጂኦ ዞኖች ገጽ ላይ በዞን ደረጃም ሊስተካከሉ ይችላሉ።",
      emptyTitle: "የጂኦ ዞን ህግ የለም",
      emptyDescription: "የጂኦ ዞን ክስተቶችን ማመንጨት ለመጀመር ህግ ይፍጠሩ።",
    },

    columns: {
      geozone: "ጂኦ ዞን",
      trigger: "አስነሺ", // review: "Trigger"
      threshold: "ገደብ",
      severity: "የክብደት ደረጃ",
      active: "ንቁ",
    },

    toggleAria: "ህግን ቀይር",
    deleteAria: "ህግን ሰርዝ",

    deleteTitle: "ህጉን ይሰረዝ?",
    deleteDescription: "ለ{{zone}} ያለው የ{{type}} ህግ ክስተቶችን ማመንጨት ያቆማል።",
    deleteFallbackZone: "ይህ ዞን",

    toast: {
      created: "ህግ ተፈጥሯል",
      updated: "ህግ ተዘምኗል",
      deleted: "ህግ ተሰርዟል",
      saveError: "ህግ ማስቀመጥ አልተቻለም",
      updateError: "ህግ ማዘመን አልተቻለም",
      deleteError: "ህግ መሰረዝ አልተቻለም",
      invalidThreshold: "ትክክለኛ ገደብ ያስገቡ",
      invalidSpeedLimit: "ትክክለኛ የፍጥነት ገደብ ያስገቡ",
      chooseGeozone: "ለዚህ ህግ ጂኦ ዞን ይምረጡ",
    },

    form: {
      editTitle: "የጂኦ ዞን ህግ አስተካክል",
      createTitle: "አዲስ የጂኦ ዞን ህግ",
      description: "ተሽከርካሪ ይህን ሁኔታ ሲያስነሳ ክስተት ያመነጫል።",
      saveChanges: "ለውጦችን አስቀምጥ",
      createRule: "ህግ ፍጠር",
      triggerLabel: "አስነሺ", // review: "Trigger"
      geozoneLabel: "ጂኦ ዞን",
      geozonePlaceholder: "ጂኦ ዞን ይምረጡ",
      speedLimitLabel: "የፍጥነት ገደብ (ኪሜ/ሰ)",
      severityLabel: "የክብደት ደረጃ",
      ruleActive: "ህጉ ንቁ ነው",
    },
  },

  export: {
    at: "በ",
    severity: "የክብደት ደረጃ",
    event: "ክስተት",
    status: "ሁኔታ",
    message: "መልዕክት",
    vehicle: "ተሽከርካሪ",
    provider: "አቅራቢ",
    geozone: "ጂኦ ዞን",
    acknowledgedBy: "ያወቀው",
    acknowledgedAt: "የታወቀበት ጊዜ",
    escalatedTo: "ለበላይ የተላለፈለት",
    escalatedAt: "ለበላይ የተላለፈበት ጊዜ",
    closedBy: "የዘጋው",
    closedAt: "የተዘጋበት ጊዜ",
    resolutionNote: "የመፍትሄ ማስታወሻ",
  },
}
