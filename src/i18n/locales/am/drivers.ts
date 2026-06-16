// Amharic (አማርኛ) — Drivers feature. Shape mirrors en/drivers.ts exactly
// (typed as typeof en), so every key/nesting/plural suffix must match.
export default {
  title: "አሽከርካሪዎች",
  description: "የአሽከርካሪ መገለጫዎች፣ የተሽከርካሪ ምደባዎች እና የደህንነት መዝገቦች።",
  addDriver: "አሽከርካሪ ጨምር",

  stats: {
    total: "ጠቅላላ አሽከርካሪዎች",
    active: "ንቁ",
    assigned: "የተመደቡ",
    unassigned: "ያልተመደቡ",
    expiring: "ጊዜያቸው የሚያበቃ ፍቃዶች",
    expiringHint: "በ{{count}} ቀናት ውስጥ",
  },

  filters: {
    assignment: "ምደባ",
    withAssignment: "ከምደባ ጋር",
    withoutAssignment: "ያለ ምደባ",
    status: "ሁኔታ",
    entity: "ተቋም",
  },

  table: {
    searchPlaceholder: "በስም፣ በፍቃድ፣ በስልክ ፈልግ…",
    name: "ስም",
    entity: "ተቋም",
    license: "መንጃ ፍቃድ",
    phone: "ስልክ",
    assignedVehicle: "የተመደበ ተሽከርካሪ",
    status: "ሁኔታ",
    emptyTitle: "ምንም አሽከርካሪ አልተገኘም",
    emptyDescription: "ማጣሪያዎችዎን ያስተካክሉ ወይም ለመጀመር አዲስ አሽከርካሪ ይጨምሩ።",
  },

  license: {
    expiresIn: "በ{{count}} ቀናት ውስጥ ያበቃል",
    expiredAgo: "ከ{{count}} ቀናት በፊት አብቅቷል",
    inDays: "በ{{count}} ቀናት ውስጥ",
  },

  detail: {
    driver: "አሽከርካሪ",
    notFoundTitle: "አሽከርካሪ አልተገኘም",
    notFoundDescription: "ይህ አሽከርካሪ ተወግዶ ሊሆን ይችላል።",
    backToDrivers: "ወደ አሽከርካሪዎች ተመለስ",
    subtitle: "{{license}} · ምድብ {{category}}",
    assignVehicle: "ተሽከርካሪ መድብ",

    profile: {
      title: "መገለጫ",
      phone: "ስልክ",
      email: "ኢሜይል",
      license: "መንጃ ፍቃድ",
      licenseExpiry: "የፍቃድ ማብቂያ",
      entity: "ተቋም",
      hireDate: "የቅጥር ቀን",
      emergencyContact: "የአደጋ ጊዜ ተጠሪ",
      notProvided: "አልተሰጠም",
    },

    safety: {
      title: "የደህንነት መዝገብ",
      outOf: "/ 100",
      excellent: "በጣም ጥሩ",
      fair: "መካከለኛ", // review: "Fair"
      needsAttention: "ትኩረት ይፈልጋል",
      drivingEvents: "የአነዳድ ክስተቶች",
      harshBraking: "ኃይለኛ ብሬክ", // review: "Harsh braking"
      harshAcceleration: "ኃይለኛ ፍጥነት መጨመር", // review: "Harsh acceleration"
      speedingEvents: "ከመጠን በላይ ፍጥነት ክስተቶች",
      assignedVehicle: "የተመደበ ተሽከርካሪ",
      noVehicle: "ለዚህ አሽከርካሪ ምንም ተሽከርካሪ አልተመደበም።",
    },

    deleteTitle: "አሽከርካሪ ሰርዝ",
    deleteDescription:
      "{{name}}ን ከመዝገቡ ማስወገድ ይፈልጋሉ? ማንኛውም የተመደበ ተሽከርካሪ ይነጠላል። ይህ መልሶ ሊቀለበስ አይችልም።",
    deleteConfirm: "አሽከርካሪ ሰርዝ",
  },

  form: {
    editTitle: "አሽከርካሪ አስተካክል",
    addTitle: "አሽከርካሪ ጨምር",
    editDescription: "የዚህን አሽከርካሪ መገለጫ እና የፍቃድ ዝርዝሮች ያዘምኑ።",
    addDescription: "አዲስ አሽከርካሪ ይመዝግቡ። የተሽከርካሪ ምደባ በተናጠል ይከናወናል።",
    saveChanges: "ለውጦችን አስቀምጥ",
    licenseNumber: "የፍቃድ ቁጥር",
    category: "ምድብ",
    expiry: "ማብቂያ",
    hireDate: "የቅጥር ቀን",
    emergencyContact: "የአደጋ ጊዜ ተጠሪ",
    emergencyPhone: "የአደጋ ጊዜ ስልክ",
    emergencyContactPlaceholder: "የተጠሪ ስም",
    selectEntity: "ተቋም ይምረጡ",
  },

  assign: {
    title: "ተሽከርካሪ መድብ",
    description: "{{name}} የሚነዳውን ተሽከርካሪ ይምረጡ።",
    saveAssignment: "ምደባ አስቀምጥ",
    vehicle: "ተሽከርካሪ",
    selectVehicle: "ተሽከርካሪ ይምረጡ",
    hint: "ያለ አሽከርካሪ ያሉ ተሽከርካሪዎች ብቻ ይታያሉ። እዚህ መመደብ ማንኛውንም የቀድሞ ግንኙነት በራስ-ሰር ያላቅቃል።",
  },

  toast: {
    removed: "{{name}} ተወግዷል።",
    deleteError: "አሽከርካሪውን መሰረዝ አልተሳካም።",
    requiredFields: "የመጀመሪያ ስም፣ የአባት ስም እና የፍቃድ ቁጥር ያስፈልጋሉ።",
    saved: "{{name}} ተቀምጧል።",
    saveError: "አሽከርካሪውን ማስቀመጥ አልተሳካም።",
    added: "{{name}} ተጨምሯል።",
    addError: "አሽከርካሪ መጨመር አልተሳካም።",
    unassigned: "ተሽከርካሪ ከ{{name}} ተነጥሏል።",
    assigned: "{{plate}} ለ{{name}} ተመድቧል።",
    assignError: "ምደባውን ማዘመን አልተሳካም።",
    fallbackVehicle: "ተሽከርካሪ",
  },
}
