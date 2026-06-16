// Amharic (አማርኛ) — maintenance feature. Shape mirrors en/maintenance.ts.
export default {
  title: "ጥገና",
  description: "በክትትል ስር ባለው ፍሊት ላይ የመከላከያ ጥገና መርሃ ግብሮች።", // review: "Preventive maintenance schedules"
  newTask: "አዲስ ተግባር",

  // Dynamic remaining/due labels — assembled in src/lib/status.ts via i18n.t().
  kmLeft: "{{km}} ቀርቷል", // review: "{{km}} left"
  overdueKm: "በ{{km}} አልፎታል", // review: "Overdue by {{km}}"
  daysLeft_one: "{{count}} ቀን ቀርቷል",
  daysLeft_other: "{{count}} ቀናት ቀርተዋል", // review: "days left"
  overdueDays_one: "በ{{count}} ቀን አልፎታል",
  overdueDays_other: "በ{{count}} ቀናት አልፎታል",
  dueAtKm: "በ{{km}} ይደርሳል", // review: "Due at {{km}}"
  dueOnDate: "በ{{date}} ይደርሳል", // review: "Due on {{date}}"

  stats: {
    totalTasks: "ጠቅላላ ተግባራት",
    totalTasksHint: "ንቁ መርሃ ግብሮች", // review: "Active schedules"
    vehiclesOk: "ደህና ተሽከርካሪዎች", // review: "Vehicles OK"
    vehiclesOkHint: "በአገልግሎት ክፍተት ውስጥ", // review: "Within service window"
    waiting: "በመጠባበቅ ላይ",
    waitingHint: "ወደ መድረሻ እየቀረበ", // review: "Approaching due"
    delay: "ዘግይቷል / አልፎታል",
    delayHint: "ከመድረሻ ቀን ያለፈ", // review: "Past due date"
    spend90: "ወጪ (90 ቀናት)", // review: "Spend (90 days)"
    spend90Hint: "የተመዘገበ የአገልግሎት ወጪ", // review: "Logged service cost"
    totalSpend: "ጠቅላላ ወጪ",
    totalSpendHint: "ሁሉም የተመዘገቡ አገልግሎቶች", // review: "All recorded services"
    servicesLogged: "የተመዘገቡ አገልግሎቶች", // review: "Services logged"
    servicesLoggedHint: "በመዝገብ ላይ ያሉ የስራ ትዕዛዞች", // review: "Work orders on file"
  },

  filters: {
    searchPlaceholder: "ተግባራትን ፈልግ…",
    statusAll: "ሁኔታ: ሁሉም",
    statusValue: "ሁኔታ: {{value}}",
    triggerAll: "የሚቀሰቀስበት: ሁሉም",
    triggerValue: "የሚቀሰቀስበት: {{value}}",
    triggerMileage: "ኪሎ ሜትር", // review: "Mileage"
    triggerDate: "ቀን",
    sortTitle: "ቅደም ተከተል: ርዕስ", // review: "Sort: Title"
    sortDue: "ቅደም ተከተል: በቅርብ የሚደርስ", // review: "Sort: Soonest due"
    sortOptionDue: "በቅርብ የሚደርስ", // review: "Soonest due"
    sortOptionTitle: "ርዕስ (ሀ–ፐ)", // review: "Title (A–Z)"
  },

  empty: {
    title: "እስካሁን ምንም የጥገና ተግባር የለም", // review: "No maintenance tasks yet"
    description: "የመከላከያ ጥገና መርሃ ግብር ይፍጠሩ እና በክትትል ስር ላሉ ተሽከርካሪዎች ይመድቡ።", // review: "Create a preventive maintenance schedule and assign it to vehicles"
    noMatchTitle: "ምንም ተግባር አልተገኘም", // review: "No tasks match"
    noMatchDescription: "የጥገና መርሃ ግብሮችን ለማየት ፍለጋውን ወይም ማጣሪያዎቹን ያስተካክሉ።", // review: "Adjust the search or filters"
  },

  card: {
    everyKm: "በየ {{km}} ኪሜ", // review: "Every {{km}} km"
    everyDays_one: "በየ {{count}} ቀን",
    everyDays_other: "በየ {{count}} ቀናት",
    recurring: "ተደጋጋሚ",
    warnsKmBefore: "ከ{{km}} በፊት ያስጠነቅቃል", // review: "Warns {{km}} before"
    warnsDaysBefore_one: "ከ{{count}} ቀን በፊት ያስጠነቅቃል",
    warnsDaysBefore_other: "ከ{{count}} ቀናት በፊት ያስጠነቅቃል",
    taskActions: "የተግባር እርምጃዎች", // review: "Task actions"
    vehiclesCount_one: "{{count}} ተሽከርካሪ",
    vehiclesCount_other: "{{count}} ተሽከርካሪዎች",
    confirmDue: "{{count}} የሚደርሱ አረጋግጥ", // review: "Confirm {{count}} due"
    allUpToDate: "ሁሉም ተሽከርካሪዎች ወቅታዊ ናቸው", // review: "All vehicles up to date"
    viewVehicles_one: "{{count}} ተሽከርካሪ እና ታሪክ ይመልከቱ",
    viewVehicles_other: "{{count}} ተሽከርካሪዎች እና ታሪክ ይመልከቱ",
  },

  detail: {
    breadcrumb: "ጥገና",
    notFoundTitle: "የጥገና ተግባር አልተገኘም", // review: "Maintenance task not found"
    notFoundDescription: "ይህ መርሃ ግብር ተወግዶ ሊሆን ይችላል።", // review: "This schedule may have been removed."
    backToMaintenance: "ወደ ጥገና ተመለስ",
    everyKm: "በየ {{km}} ኪሜ",
    everyDays_one: "በየ {{count}} ቀን",
    everyDays_other: "በየ {{count}} ቀናት",
    recurring: "ተደጋጋሚ",
    alertsKmBefore: "ከመድረሱ {{km}} በፊት ያስጠነቅቃል", // review: "Alerts {{km}} before due"
    alertsDaysBefore_one: "ከመድረሱ {{count}} ቀን በፊት ያስጠነቅቃል",
    alertsDaysBefore_other: "ከመድረሱ {{count}} ቀናት በፊት ያስጠነቅቃል",
    automaticConfirmation: "በራስ-ሰር ማረጋገጫ", // review: "Automatic confirmation"
    manualConfirmation: "በእጅ ማረጋገጫ", // review: "Manual confirmation"
    statusMix: "የሁኔታ ድብልቅ", // review: "Status mix"
    vehiclesOnSchedule: "በዚህ መርሃ ግብር ላይ ያሉ ተሽከርካሪዎች", // review: "Vehicles on this schedule"
    confirmDue: "{{count}} የሚደርሱ አረጋግጥ",
    allUpToDate: "ሁሉም ወቅታዊ ናቸው", // review: "All up to date"
    searchPlaceholder: "ታርጋ ወይም አቅራቢ ፈልግ…", // review: "Search plate or provider"
    colVehicle: "ተሽከርካሪ",
    colProvider: "አቅራቢ", // review: "Provider"
    colStatus: "ሁኔታ",
    colRemaining: "የቀረ", // review: "Remaining"
    colDue: "የሚደርስ", // review: "Due"
    colLastService: "መጨረሻ የተደረገ አገልግሎት",
    noRecord: "መዝገብ የለም", // review: "No record"
    logService: "አገልግሎት መዝግብ",
    vehiclesNoMatchTitle: "ምንም ተሽከርካሪ አልተገኘም",
    vehiclesNoMatchDescription: "ፍለጋውን ወይም የሁኔታ ማጣሪያውን ያስተካክሉ።", // review: "Adjust the search or status filter."
    serviceHistory: "የአገልግሎት ታሪክ",
    recordsCount_one: "{{count}} መዝገብ",
    recordsCount_other: "{{count}} መዝገቦች", // review: "records"
    noServicesTitle: "እስካሁን ምንም አገልግሎት አልተመዘገበም", // review: "No services logged yet"
    noServicesDescription: "የተመዘገቡ እና የተረጋገጡ አገልግሎቶች እዚህ እንደ የስራ ትዕዛዝ ይታያሉ።", // review: "Logged and confirmed services will appear here as work orders."
    deleteTitle: "የጥገና ተግባር ሰርዝ",
    deleteDescription_one:
      "“{{title}}” እና ለ{{count}} ተሽከርካሪ ያለው መርሃ ግብር ይወገዳል። ይህ ሊቀለበስ አይችልም።", // review: "... will be removed. This cannot be undone."
    deleteDescription_other:
      "“{{title}}” እና ለ{{count}} ተሽከርካሪዎች ያለው መርሃ ግብር ይወገዳል። ይህ ሊቀለበስ አይችልም።",
  },

  form: {
    editTitle: "የጥገና ተግባር አስተካክል",
    addTitle: "አዲስ የጥገና ተግባር",
    description: "የመከላከያ ጥገና መርሃ ግብር ያስይዙ እና የሚሸፍናቸውን ተሽከርካሪዎች ይምረጡ።", // review: "Schedule preventive maintenance and pick the vehicles it covers."
    saveChanges: "ለውጦችን አስቀምጥ",
    createTask: "ተግባር ፍጠር",
    title: "ርዕስ",
    titlePlaceholder: "ለምሳሌ የሞተር ዘይት እና ማጣሪያ ቅያሪ", // review: "Engine oil & filter change"
    descriptionLabel: "መግለጫ",
    descriptionPlaceholder: "አገልግሎቱ ስለሚያካትተው አማራጭ ማስታወሻዎች።", // review: "Optional notes on what the service involves."
    triggerBy: "የሚቀሰቀስበት",
    mileage: "ኪሎ ሜትር",
    mileageHint: "በየ N ኪሜ አገልግሎት መስጠት", // review: "Service every N km"
    date: "ቀን",
    dateHint: "በየ N ቀናት አገልግሎት መስጠት", // review: "Service every N days"
    intervalKm: "ክፍተት (ኪሜ)",
    alertBeforeKm: "ቅድመ ማስጠንቀቂያ (ኪሜ)", // review: "Alert before (km)"
    lastServiceKm: "መጨረሻ የተደረገ አገልግሎት (ኪሜ)",
    lastServiceKmPlaceholder: "የተሽከርካሪ ኪሎ ሜትር", // review: "Vehicle odometer"
    intervalDays: "ክፍተት (ቀናት)",
    alertBeforeDays: "ቅድመ ማስጠንቀቂያ (ቀናት)",
    lastServiceDate: "መጨረሻ የተደረገ አገልግሎት ቀን",
    mileageHelp:
      "እያንዳንዱ ተሽከርካሪ ከአሁኑ ኪሎ ሜትር እንዲጀምር “መጨረሻ የተደረገ አገልግሎት” ባዶ ይተዉት።", // review: "Leave 'last service' blank to start each vehicle from its current odometer."
    dateHelp: "እያንዳንዱ ተሽከርካሪ ከዛሬ እንዲጀምር “መጨረሻ የተደረገ አገልግሎት ቀን” ባዶ ይተዉት።", // review: "Leave 'last service date' blank to start each vehicle from today."
    confirmation: "ማረጋገጫ",
    manualConfirmation: "በእጅ ማረጋገጫ",
    automaticConfirmation: "በራስ-ሰር ማረጋገጫ",
    options: "አማራጮች",
    repeatAfterService: "ከእያንዳንዱ አገልግሎት በኋላ ይድገም", // review: "Repeat after each service"
    emailNotifications: "የኢሜይል ማሳወቂያዎች",
    vehicles: "ተሽከርካሪዎች",
    vehiclesSelected: "({{count}} ተመርጧል)", // review: "({{count}} selected)"
  },

  log: {
    title: "አገልግሎት መዝግብ",
    description: "ለ{{plate}} የተጠናቀቀ {{task}} መዝግብ።", // review: "Record a completed {{task}} for {{plate}}."
    serviceDate: "የአገልግሎት ቀን",
    cost: "ወጪ (ብር)", // review: "Cost (ETB)"
    odometer: "በአገልግሎት ጊዜ የነበረ ኪሎ ሜትር (ኪሜ)", // review: "Odometer at service (km)"
    odometerPlaceholder: "የአሁኑ ኪሎ ሜትር", // review: "Current odometer"
    workshop: "ጋራዥ", // review: "Workshop"
    technician: "ቴክኒሺያን", // review: "Technician"
    technicianPlaceholder: "ለምሳሌ አበበ በቀለ",
    notes: "ማስታወሻዎች",
    notesPlaceholder: "ስለተሰራው ስራ አማራጭ ማስታወሻዎች።", // review: "Optional notes on the work performed."
  },

  multiSelect: {
    searchPlaceholder: "በታርጋ፣ በተቋም ወይም በዓይነት ፈልግ…", // review: "Search by plate, entity, or type"
    selectAll: "ሁሉንም ምረጥ",
    vehiclesCount_one: "{{count}} ተሽከርካሪ",
    vehiclesCount_other: "{{count}} ተሽከርካሪዎች",
    shownSuffix: " ታይቷል", // review: " shown"
    selectedCount: "{{count}} ተመርጧል",
    noMatch: "“{{query}}” የሚዛመድ ተሽከርካሪ የለም።", // review: "No vehicles match '{{query}}'."
  },

  pie: {
    vehicles: "ተሽከርካሪዎች",
    noVehicles: "ተሽከርካሪ የለም",
    vehiclesLabel: "ተሽከርካሪዎች",
  },

  toast: {
    created: "የጥገና ተግባር ተፈጥሯል",
    updated: "የጥገና ተግባር ተዘምኗል",
    deleted: "የጥገና ተግባር ተሰርዟል",
    saveFailed: "ተግባሩን ማስቀመጥ አልተሳካም",
    operationFailed: "ክንውኑ አልተሳካም", // review: "Operation failed"
    confirmedServiced_one: "{{count}} ተሽከርካሪ አገልግሎት መሰጠቱ ተረጋግጧል",
    confirmedServiced_other: "{{count}} ተሽከርካሪዎች አገልግሎት መሰጠታቸው ተረጋግጧል",
    serviceLogged: "ለ{{plate}} አገልግሎት ተመዝግቧል", // review: "Service logged for {{plate}}"
    logServiceFailed: "አገልግሎት መመዝገብ አልተሳካም",
    titleRequired: "ለተግባሩ ርዕስ ይስጡ።", // review: "Give the task a title."
    mileageIntervalRequired: "አዎንታዊ የኪሎ ሜትር ክፍተት ያስገቡ።", // review: "Enter a positive mileage interval."
    dayIntervalRequired: "አዎንታዊ የቀን ክፍተት ያስገቡ።", // review: "Enter a positive day interval."
    selectVehicle: "ቢያንስ አንድ ተሽከርካሪ ይምረጡ።", // review: "Select at least one vehicle."
    pickServiceDate: "የአገልግሎት ቀኑን ይምረጡ።", // review: "Pick the service date."
    enterValidCost: "ትክክለኛ ወጪ ያስገቡ።", // review: "Enter a valid cost."
  },
}
