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
    location: "አካባቢ", // review: "Location"
    when: "መቼ",
    emptyTitle: "ምንም ክስተት አይዛመድም", // review: "No events match"
    emptyDescription: "ማጣሪያዎቹን ያስተካክሉ ወይም የቀጥታ ምግቡን ይጠብቁ።",
  },

  alertBanner: {
    message_one: "{{count}} አሳሳቢ ማንቂያ ትኩረት ይፈልጋል", // review: "1 critical alert needs attention"
    message_other: "{{count}} አሳሳቢ ማንቂያዎች ትኩረት ይፈልጋሉ",
    action: "ይገምግሙ",
    dismiss: "አስወግድ",
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
    route: "መስመር",
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
    description: "ፍሊቱን ለጥሰቶች የሚከታተሉ እና ሲከሰቱ ማንቂያ የሚያስነሱ አስነሺዎች።", // review: "Triggers that watch the fleet for violations and raise alerts."
    newRule: "አዲስ ህግ",

    targeted: {
      title: "አስነሺዎች", // review: "Triggers"
      description: "የጂኦ ዞን እና የመስመር አስነሺዎች፣ ለተወሰኑ ተሽከርካሪዎች ሊገደቡ ይችላሉ።",
      emptyTitle: "ገና አስነሺ የለም",
      emptyDescription: "ማንቂያ ማስነሳት ለመጀመር አስነሺ ይፍጠሩ።",
    },

    columns: {
      name: "አስነሺ", // review: "Trigger"
      scope: "ወሰን", // review: "Scope"
      vehicles: "ተሽከርካሪዎች",
      threshold: "ገደብ",
      severity: "የክብደት ደረጃ",
      notify: "አሳውቅ", // review: "Notify"
      active: "ንቁ",
    },

    scopeFleet: "ፍሊት-አቀፍ",
    vehiclesAll: "ሁሉም ተሽከርካሪዎች",
    vehiclesCount_one: "{{count}} ተሽከርካሪ",
    vehiclesCount_other: "{{count}} ተሽከርካሪዎች",
    notifyInAppOnly: "በመተግበሪያ ውስጥ ብቻ", // review: "In-app only"

    toggleAria: "ህግን ቀይር",
    deleteAria: "ህግን ሰርዝ",

    deleteTitle: "ህጉን ይሰረዝ?",
    deleteDescription: "“{{name}}” አስነሺ ማንቂያ ማስነሳት ያቆማል።",

    toast: {
      created: "የክስተት ህግ ተፈጥሯል",
      updated: "የክስተት ህግ ተዘምኗል",
      deleted: "ህግ ተሰርዟል",
      saveError: "ህግ ማስቀመጥ አልተቻለም",
      updateError: "ህግ ማዘመን አልተቻለም",
      deleteError: "ህግ መሰረዝ አልተቻለም",
      invalidThreshold: "ትክክለኛ ገደብ ያስገቡ",
      invalidSpeedLimit: "ትክክለኛ የፍጥነት ገደብ ያስገቡ",
      invalidDeviation: "ትክክለኛ የመውጣት ርቀት ያስገቡ", // review: "Enter a valid deviation distance"
      nameRequired: "ለአስነሺው ስም ይስጡ",
      chooseGeozone: "ለዚህ አስነሺ ጂኦ ዞን ይምረጡ",
      chooseRoute: "ለዚህ አስነሺ መስመር ይምረጡ",
      chooseVehicles: "ቢያንስ አንድ ተሽከርካሪ ይምረጡ",
      notFound: "ይህ ህግ ከእንግዲህ የለም",
    },

    wizard: {
      createTitle: "አዲስ የክስተት ህግ",
      editTitle: "የክስተት ህግ አስተካክል",
      createDescription: "የሚከታተሉትን ጥሰት እና ሲከሰት ምን መሆን እንዳለበት ይግለጹ።",
      editDescription: "ይህን አስነሺ እና ሲከሰት ምን እንደሚሆን ያዘምኑ።",
      back: "ተመለስ",
      next: "ቀጥል",
      cancel: "ሰርዝ",
      save: "ህግ ፍጠር",
      saveChanges: "ለውጦችን አስቀምጥ",

      steps: {
        trigger: "አስነሺ",
        where: "የት",
        vehicles: "ተሽከርካሪዎች",
        action: "እርምጃ",
      },

      step1: {
        title: "ይህ አስነሺ ምን መከታተል አለበት?",
        description: "ይህን ማንቂያ የሚያስነሳውን የጥሰት ዓይነት ይምረጡ።",
        nameLabel: "የአስነሺ ስም",
        namePlaceholder: "ለምሳሌ የአዋሽ ኬላ ፍጥነት",
        locationGroup: "በአካባቢ ላይ የተመሰረተ",
        fleetGroup: "ፍሊት-አቀፍ",
      },

      step2: {
        title: "የት ይተገበራል?",
        geozoneLabel: "ጂኦ ዞን",
        geozonePlaceholder: "ጂኦ ዞን ይምረጡ",
        routeLabel: "መስመር",
        routePlaceholder: "መስመር ይምረጡ",
        speedLimitLabel: "የፍጥነት ገደብ (ኪሜ/ሰ)",
        deviationLabel: "የመውጣት ርቀት (ሜ)",
        idleLabel: "ስራ ፈትቶ የመቆም ገደብ (ደቂቃ)",
        noSignalLabel: "የምልክት ጊዜ ማብቂያ (ደቂቃ)",
        fleetSpeedLabel: "የፍሊት ፍጥነት ገደብ (ኪሜ/ሰ)",
        fleetNote: "ይህ አስነሺ በመላው ኮሪደር ላይ ይተገበራል — የሚመረጥ አካባቢ የለም።",
        previewTitle: "ቅድመ እይታ",
        previewEmpty: "በካርታ ላይ ለማየት አካባቢ ይምረጡ።",
      },

      step3: {
        title: "የትኞቹን ተሽከርካሪዎች ይከታተላል?",
        description: "መላውን ፍሊት ይከታተሉ ወይም አስነሺውን ለተወሰኑ ተሽከርካሪዎች ይገድቡ።",
        allLabel: "ሁሉም ተሽከርካሪዎች",
        allHint: "በክትትል ስር ያለ ሁሉም ተሽከርካሪ ይከታተላል።",
        specificLabel: "የተወሰኑ ተሽከርካሪዎች",
        specificHint: "የመረጧቸው ተሽከርካሪዎች ብቻ ይከታተላሉ።",
      },

      step4: {
        title: "ማንቂያ እና ማሳወቂያዎች",
        description: "የማንቂያውን የክብደት ደረጃ እና ማን እንደሚሳወቅ ያዘጋጁ።",
        severityLabel: "የክብደት ደረጃ",
        notifyTitle: "ማሳወቂያዎች",
        inApp: "በመተግበሪያ ውስጥ ማንቂያ",
        inAppHint: "ሁልጊዜ ንቁ — በክስተቶች ምግብ ውስጥ ይታያል።",
        email: "ኢሜይል",
        emailPlaceholder: "ops@example.gov.et",
        sms: "ኤስኤምኤስ",
        smsPlaceholder: "+251…",
        reviewTitle: "ግምገማ",
        reviewType: "አስነሺ",
        reviewScope: "ወሰን",
        reviewVehicles: "ተሽከርካሪዎች",
        reviewSeverity: "የክብደት ደረጃ",
        reviewNotify: "አሳውቅ",
      },

      triggerDescriptions: {
        entry: "ተሽከርካሪ ወደ ጂኦ ዞን ሲገባ ያስነሳል።",
        exit: "ተሽከርካሪ ከጂኦ ዞን ሲወጣ ያስነሳል።",
        speeding: "ተሽከርካሪ በጂኦ ዞን ውስጥ ሲፈጥን ያስነሳል።",
        route_deviation: "ተሽከርካሪ ከመስመሩ ኮሪደር ሲወጣ ያስነሳል።",
        global_speeding: "ተሽከርካሪ የፍሊት ፍጥነት ገደብን በማንኛውም ቦታ ሲያልፍ ያስነሳል።",
        idle: "ተሽከርካሪ ከገደቡ በላይ ስራ ፈትቶ ሲቆም ያስነሳል።",
        no_signal: "መሳሪያ ከገደቡ በላይ መላክ ሲያቆም ያስነሳል።",
      },
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
