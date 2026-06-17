// Amharic (አማርኛ) — fleet (vehicles) feature. Shape mirrors en/vehicles.ts.
export default {
  title: "ፍሊት",
  description: "በኮሪደሩ ላይ በክትትል ስር ባሉ ተቋማት የሚንቀሳቀሱ ተሽከርካሪዎች።",
  addVehicle: "ተሽከርካሪ ጨምር",
  searchPlaceholder: "ታርጋ፣ ሞዴል ወይም ተቋም ፈልግ…",
  emptyTitle: "ምንም ተሽከርካሪ አልተገኘም",
  emptyDescription: "ፍለጋዎን ወይም ማጣሪያዎችዎን ለማስተካከል ይሞክሩ።",

  stats: {
    total: "ጠቅላላ ተሽከርካሪዎች",
    moving: "በመንቀሳቀስ ላይ",
    idling: "ስራ ፈትቶ መቆም",
    stopped: "የቆሙ",
    noSignal: "ምልክት የለም",
    entitiesMonitored: "በክትትል ስር ያሉ ተቋማት",
  },

  filters: {
    status: "ሁኔታ",
    type: "ዓይነት",
    entity: "ተቋም",
    region: "ክልል",
    gps: "ጂፒኤስ",
  },

  table: {
    plate: "ታርጋ",
    entity: "ተቋም",
    driver: "አሽከርካሪ",
    status: "ሁኔታ",
    speed: "ፍጥነት",
    lastSync: "መጨረሻ የተገናኘበት",
    region: "ክልል",
  },

  form: {
    editTitle: "ተሽከርካሪ አስተካክል",
    addTitle: "ተሽከርካሪ ጨምር",
    editDescription: "የዚህን ተሽከርካሪ የምዝገባ እና የክትትል ዝርዝሮች ያዘምኑ።",
    addDescription: "በክትትል ስር ባለ ተቋም የሚንቀሳቀስ አዲስ ተሽከርካሪ ይመዝግቡ።",
    saveChanges: "ለውጦችን አስቀምጥ",
    plateNumber: "የታርጋ ቁጥር",
    platePlaceholder: "3-45821 ET",
    descriptionPlaceholder: "Sinotruk Howo A7 dry cargo",
    selectEntity: "ተቋም ይምረጡ",
    assignedRoute: "የተመደበ መስመር",
    noRoute: "መስመር የለም",
  },

  toast: {
    created: "ተሽከርካሪ {{plate}} ተጨምሯል",
    updated: "ተሽከርካሪ {{plate}} ተዘምኗል",
    deleted: "ተሽከርካሪ {{plate}} ተሰርዟል",
    createFailed: "ተሽከርካሪ መጨመር አልተሳካም",
    updateFailed: "ተሽከርካሪ ማዘመን አልተሳካም",
    deleteFailed: "ተሽከርካሪ መሰረዝ አልተሳካም",
  },

  detail: {
    notFoundTitle: "ተሽከርካሪ አልተገኘም",
    notFoundDescription: "ይህ ተሽከርካሪ ከፍሊቱ ተወግዶ ሊሆን ይችላል።",
    backToFleet: "ወደ ፍሊት ተመለስ",
    deleteTitle: "ተሽከርካሪ ሰርዝ",
    deleteDescription: "{{plate}} ከፍሊቱ ለዘላለም ይወገድ? ይህ መቀልበስ አይቻልም።",
    deleteConfirm: "ተሽከርካሪ ሰርዝ",

    identity: {
      entityFallback: "—",
    },

    map: {
      title: "የቀጥታ ካርታ",
      follow: "ተከታተል",
      shareLocation: "አካባቢ አጋራ",
      locationCopied: "አካባቢ ወደ ቅንጥብ ሰሌዳ ተቀድቷል",
      copyFailed: "አካባቢ መቅዳት አልተቻለም",
      synced: "ተገናኝቷል",
    },

    driver: {
      title: "የአሽከርካሪ ምደባ ታሪክ",
      activeNow: "አሁን ንቁ",
      unassigned: "ያልተመደበ",
      noneAtWheel: "በአሁኑ ጊዜ ምንም አሽከርካሪ መሪው ላይ የለም።",
      since: "ከ{{date}} ጀምሮ",
      previous: "ቀዳሚ",
      removedDriver: "የተወገደ አሽከርካሪ",
      present: "አሁን",
    },

    live: {
      title: "የቀጥታ ሁኔታ",
      status: "ሁኔታ",
      location: "አካባቢ",
      route: "መስመር",
      coordinates: "መጋጠሚያዎች", // review: መጋጠሚያዎች → Coordinates
      speed: "ፍጥነት",
      odometer: "ኪሎ ሜትር",
      lastSync: "መጨረሻ የተገናኘበት",
      fuelLevel: "የነዳጅ መጠን",
      onCorridor: "በኮሪደሩ ላይ",
    },

    events: {
      title: "የቅርብ ጊዜ ክስተቶች",
      empty: "ምንም የጂኦ ዞን፣ የፍጥነት ወይም የምልክት ክስተቶች አልተመዘገቡም።",
    },

    travel: {
      title: "የጉዞ ታሪክ",
      attributedByDriver: "· በአሽከርካሪ የተመደበ",
      emptyTitle: "የጉዞ ታሪክ የለም",
      emptyDescription: "የዚህ ተሽከርካሪ የተጠናቀቁ ጉዞዎች ለድጋሚ ማጫወት እዚህ ይታያሉ።",
      unattributed: "ያልተመደበ",
      colWhen: "መቼ",
      colTrip: "ጉዞ",
      colDistance: "ርቀት",
      colDriver: "አሽከርካሪ",
      playbackTitle: "የጉዞ ድጋሚ ማጫወት", // review: የጉዞ ድጋሚ ማጫወት → Trip playback
      closePlayback: "ድጋሚ ማጫወትን ዝጋ",
    },

    report: {
      title: "ሪፖርቶች",
      subtitle: "ክስተቶች እና የጉዞ ታሪክ (CSV / Excel)",
      eventsCsv: "ክስተቶች (CSV)",
      travelCsv: "የጉዞ ታሪክ (CSV)",
      noEvents: "ለዚህ ተሽከርካሪ ለመላክ ምንም ክስተቶች የሉም",
      noTravel: "ለዚህ ተሽከርካሪ ለመላክ ምንም የጉዞ ታሪክ የለም",
      eventsExported: "የክስተቶች ሪፖርት ተልኳል",
      travelExported: "የጉዞ ታሪክ ተልኳል",
      unattributed: "ያልተመደበ",
      eventHeaders: {
        severity: "ክብደት", // review: ክብደት → Severity
        event: "ክስተት",
        status: "ሁኔታ",
        message: "መልዕክት",
        geozone: "ጂኦ ዞን",
        at: "በ",
      },
      travelHeaders: {
        start: "መነሻ",
        end: "መድረሻ",
        from: "ከ",
        to: "ወደ",
        distance: "ርቀት (km)",
        avgSpeed: "አማካይ ፍጥነት (km/h)",
        maxSpeed: "ከፍተኛ ፍጥነት (km/h)",
        driver: "አሽከርካሪ",
      },
    },
  },
}
