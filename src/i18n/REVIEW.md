# Amharic localization — native-speaker review list

The Amharic (`am`) strings were machine-generated for this demo prototype. They
build and render, but the terms below are domain/government/UI terms with no single
settled Amharic standard — please have a native speaker confirm before any real
presentation. Each is also marked with a `// review:` comment at its definition in
`src/i18n/locales/am/**`.

## How the i18n layer is organized
- `src/i18n/index.ts` — i18next bootstrap (detect/persist via `localStorage["ifms.lang"]`, fallback `en`).
- `src/i18n/locales/en/<area>.ts` is the **source of truth**; `src/i18n/locales/am/<area>.ts` is typed `typeof en`, so every key must exist in both (a missing key fails `tsc`).
- To add/change a string: edit the `en/<area>.ts` key **and** the matching `am/<area>.ts` key.

## Terms to verify (English → current Amharic)

### Shared / enums (`am/enums.ts`, `am/common.ts`, `am/nav.ts`, `am/topbar.ts`)
- Cancel → ይቅር (also consider አቋርጥ)
- Idling (engine on, stationary) → ስራ ፈትቶ ቆሟል
- Ignition blocked → ሞተር ታግዷል
- Acknowledged → ታውቋል
- Escalated → ለበላይ ተላልፏል
- Critical (severity) → አሳሳቢ
- Signal timeout → የምልክት ጊዜ ማብቂያ
- Fleet (nav item) → ተሽከርካሪዎች ("Vehicles")
- Geofencing → ጂኦ-አጥር
- Fleet Officer / Fleet Operations Officer → የፍሊት ኦፊሰር / የፍሊት ኦፐሬሽን ኦፊሰር

### Vehicles (`am/vehicles.ts`, `am/enums.ts`)
- Coordinates → መጋጠሚያዎች · Trip playback → የጉዞ ድጋሚ ማጫወት · Severity → ክብደት
- Vehicle types: Saloon → ሳሎን መኪና · SUV → ኤስዩቪ · Minibus → ሚኒባስ · Van → ቫን

### Drivers (`am/drivers.ts`)
- Fair (safety band) → መካከለኛ · Harsh braking → ኃይለኛ ብሬክ · Harsh acceleration → ኃይለኛ ፍጥነት መጨመር

### Events (`am/events.ts`)
- "With a higher authority", "No events match", Location, "Handling timeline", resolution note
- Trigger (rule trigger) → አስነሺ

### Geozones / Routes (`am/geozones.ts`, `am/routes.ts`)
- Latitude → ኬክሮስ · Longitude → ኬንትሮስ · Radius → ራዲየስ · vertices → ጫፎች · Ungrouped → ያልተቧደነ

## Known scope decisions (not bugs)
- **Dummy data stays English** by design (ministry/place/route/geozone names, GPS provider brands, plate numbers, person names).
- **Dates**: Amharic uses the Gregorian calendar with Amharic month names via `Intl` (date-fns ships no `am` locale). If the Ethiopian calendar is wanted instead, change `src/lib/format.ts` (drop `calendar: "gregory"`).
- **Numbers & units** keep Western digits and English unit abbreviations (km, km/h, ETB) — standard in Ethiopian UIs.
- **`formatStatusDuration`** ("2h 14m") is not localized (unit letters only).
