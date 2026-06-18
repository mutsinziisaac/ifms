// Amharic (አማርኛ) — domain enum labels. Shape mirrors en/enums.ts.
export default {
  vehicleStatus: {
    moving: "በመንቀሳቀስ ላይ",
    idling: "ስራ ፈትቶ ቆሟል", // review: "Idling" (engine on, stationary)
    ignition_off: "ሞተር ጠፍቷል",
    no_signal: "ምልክት የለም",
    ignition_blocked: "ሞተር ታግዷል", // review: "Ignition blocked"
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
    ignition: "የማስነሻ ሁኔታ", // review: "Ignition state"
  },
  // Backend alert filter vocabulary (GET /api/v1/alerts params).
  alertStatus: {
    OPEN: "ክፍት",
    ACKNOWLEDGED: "ታውቋል", // review: "Acknowledged"
    RESOLVED: "ተፈትቷል", // review: "Resolved"
  },
  alertType: {
    SPEED: "ከመጠን በላይ ፍጥነት", // review: "Speeding"
    GEOFENCE: "ጂኦፌንስ", // review: "Geofence"
    IGNITION: "ማስነሻ", // review: "Ignition"
    TIME_AND_DISTANCE: "ስራ ፈትቶ መቆም / ርቀት", // review: "Idle / distance"
  },
  eventRuleType: {
    entry: "ወደ ጂኦ ዞን መግባት",
    exit: "ከጂኦ ዞን መውጣት",
    speeding: "የዞን ፍጥነት ገደብ",
    route_deviation: "ከመስመር መውጣት", // review: "Route deviation"
    global_speeding: "የፍሊት ፍጥነት ገደብ",
    idle: "ከመጠን በላይ ስራ ፈትቶ መቆም",
    no_signal: "የምልክት ጊዜ ማብቂያ", // review: "Signal timeout"
    ignition: "የማስነሻ ሁኔታ", // review: "Ignition state"
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
  itmsVerificationStatus: {
    VERIFIED: "ተረጋግጧል",
    NOT_FOUND: "አልተገኘም", // review: "Failed / not found in ITMS"
    UNVERIFIED: "ያልተረጋገጠ", // review: "Unverified / not yet checked"
  },
  vehicleRegistryStatus: {
    ACTIVE: "ንቁ", // review: "Active"
    SUSPENDED: "ታግዷል", // review: "Suspended"
    RETIRED: "ከአገልግሎት የወጣ", // review: "Retired"
    BLOCKED: "ተቆልፏል", // review: "Blocked"
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
