// Amharic (አማርኛ) — generic strings. Shape mirrors en/common.ts.
export default {
  // actions
  save: "አስቀምጥ",
  cancel: "ይቅር", // review: "Cancel" in dialogs — also "አቋርጥ"
  delete: "ሰርዝ",
  edit: "አስተካክል",
  add: "ጨምር",
  create: "ፍጠር",
  update: "አዘምን",
  remove: "አስወግድ",
  close: "ዝጋ",
  apply: "ተግብር",
  reset: "ዳግም አስጀምር",
  confirm: "አረጋግጥ",
  yes: "አዎ",
  no: "አይ",
  back: "ተመለስ",
  signOut: "ውጣ",
  exportCsv: "CSV ላክ",
  importCsv: "CSV አስገባ",
  markAllRead: "ሁሉንም እንደተነበበ ምልክት አድርግ",

  // generic values
  all: "ሁሉም",
  none: "ምንም",
  na: "የለም",
  unassigned: "ያልተመደበ",
  loading: "በመጫን ላይ…",
  noResults: "ምንም ውጤት የለም",

  // view toggles
  viewList: "ዝርዝር",
  viewMap: "ካርታ",

  // data table
  table: {
    searchPlaceholder: "ፈልግ…",
    showingRange: "ከ{{total}} ውስጥ {{from}}–{{to}} በማሳየት ላይ",
    previousPage: "ቀዳሚ ገጽ",
    nextPage: "ቀጣይ ገጽ",
    noResults: "ምንም ውጤት የለም",
  },

  // global search (topbar)
  search: {
    trigger: "ፍሊትን ፈልግ…", // review: "fleet"
    placeholder: "ተሽከርካሪዎች፣ አሽከርካሪዎች፣ ጂኦ ዞኖች፣ መስመሮች ፈልግ…",
    minChars: "ለመፈለግ ቢያንስ 3 ፊደላት ይተይቡ።",
    noResults: "ምንም ውጤት አልተገኘም።",
    groups: {
      vehicles: "ተሽከርካሪዎች",
      drivers: "አሽከርካሪዎች",
      geozones: "ጂኦ ዞኖች",
      routes: "መስመሮች",
    },
  },
}
