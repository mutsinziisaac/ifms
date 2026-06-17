// Amharic (አማርኛ) — domain enum labels. Shape mirrors en/enums.ts.
export default {
  vehicleStatus: {
    moving: "በመንቀሳቀስ ላይ",
    idling: "ስራ ፈትቶ ቆሟል", // review: "Idling" (engine on, stationary)
    ignition_off: "ሞተር ጠፍቷል",
    no_signal: "ምልክት የለም",
    ignition_blocked: "ሞተር ታግዷል", // review: "Ignition blocked"
  },
  driverStatus: {
    active: "ንቁ",
    on_leave: "በፈቃድ ላይ",
    suspended: "ታግዷል",
    inactive: "ንቁ ያልሆነ",
  },
  eventStatus: {
    open: "ክፍት",
    acknowledged: "ታውቋል", // review: "Acknowledged"
    escalated: "ለበላይ ተላልፏል", // review: "Escalated"
    closed: "ተዘግቷል",
  },
  eventSeverity: {
    info: "መረጃ",
    warning: "ማስጠንቀቂያ",
    critical: "አሳሳቢ", // review: "Critical"
  },
  eventType: {
    entry: "ወደ ጂኦ ዞን መግባት",
    exit: "ከጂኦ ዞን መውጣት",
    speeding: "ከመጠን በላይ ፍጥነት",
    route_deviation: "ከመስመር መውጣት", // review: "Route deviation"
    no_signal: "ምልክት ጠፍቷል",
    idle: "ከመጠን በላይ ስራ ፈትቶ መቆም",
  },
  eventRuleType: {
    entry: "ወደ ጂኦ ዞን መግባት",
    exit: "ከጂኦ ዞን መውጣት",
    speeding: "የዞን ፍጥነት ገደብ",
    route_deviation: "ከመስመር መውጣት", // review: "Route deviation"
    global_speeding: "የፍሊት ፍጥነት ገደብ",
    idle: "ከመጠን በላይ ስራ ፈትቶ መቆም",
    no_signal: "የምልክት ጊዜ ማብቂያ", // review: "Signal timeout"
  },
  providerCategory: {
    ministry: "ሚኒስቴር",
    agency: "ኤጀንሲ",
    enterprise: "ድርጅት",
  },
  vehicleType: {
    truck: "ጭነት መኪና",
    trailer: "ተጎታች",
    tanker: "ታንከር",
    bus: "አውቶቡስ",
    container: "ኮንቴይነር",
    pickup: "ፒክአፕ",
    saloon: "ሳሎን መኪና", // review: "Saloon" (sedan car)
    suv: "ኤስዩቪ", // review: "SUV" (4x4 / field vehicle)
    minibus: "ሚኒባስ", // review: "Minibus"
    van: "ቫን", // review: "Van"
  },
  incidentSeverity: {
    minor: "ቀላል",
    medium: "መካከለኛ",
    major: "ከባድ",
  },
  incidentRootCause: {
    driver_error: "የአሽከርካሪ ስህተት",
    weather: "የአየር ሁኔታ",
    mechanical: "የቴክኒክ ብልሽት",
    other: "ሌላ",
  },
  webUserStatus: {
    active: "ንቁ",
    inactive: "ንቁ ያልሆነ",
    locked: "ተቆልፏል",
  },
  roleType: {
    admin: "አስተዳዳሪ",
    fms: "FMS",
  },
}
