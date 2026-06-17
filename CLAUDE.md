# IFMS — Integrated Fleet Management System (prototype)

A high-fidelity, **demo prototype** for the Ministry of Transport & Logistics (MoTL)
Ethiopia to monitor vehicles operated by **other entities** — government ministries,
agencies and public enterprises ("providers") — along the Addis Ababa–Djibouti
corridor. All data is dummy and lives in an in-memory store — there is no backend.

Scope (per `ver.2 SRS Document 11.10.2024.docx`, since extended): Driver Management,
Vehicle/Fleet Management, Geozone Management, Routes Management, an Events workspace
(violations with an open → acknowledged → escalated → closed workflow), a Providers
dashboard (per-ministry device/transmission stats), an Event Rules configuration page,
plus a mock login and an overview dashboard.

## Commands

```sh
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build  (this is the source of truth for "is it broken")
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (0 errors; ~36 advisory warnings — see below)
npm run format     # prettier
```

To enable the live Google Map, put a key in `.env`:
`VITE_GOOGLE_MAPS_API_KEY=<key>` then restart. Without it the app still runs — maps
degrade to a styled placeholder. `.env` is git-ignored.

## Architecture

- **Stack**: Vite + React 19 + TypeScript strict, Tailwind v4 (teal/gold OKLch theme in
  `src/index.css`, Outfit font, dark mode via `d` key), shadcn/ui (`src/components/ui/`),
  react-router-dom 7, TanStack Query 5, recharts, `@vis.gl/react-google-maps`.
- **Data layer** (`src/data/`): `types.ts` (domain model) → `seed.ts` (stable seeded
  Ethiopian dummy data: 9 entities = government institutions, 48 vehicles, 36 drivers,
  12 geozones, 6 routes, 26 events with seeded workflow states,
  ~51 event rules incl. 3 fleet-wide ones, provider telemetry baselines) → `store.ts`
  (in-memory singleton DB + `subscribe`/`mutate`) → `api.ts` (async mock API with fake
  latency) → `hooks.ts` (TanStack Query hooks + mutations that cross-invalidate).
  `query-keys.ts` centralizes keys. The domain event type is **`FleetEvent`** (never a
  bare `Event` — that collides with the DOM global); its workflow transitions are
  guarded in `api.acknowledgeEvent`/`escalateEvent`/`closeEvent`.
- **Live simulation** (`src/sim/`): `simulation.ts` ticks every 1.5s — moves vehicles
  along route polylines, flips statuses, fires geofence entry/exit/speeding events for
  **active** zone rules plus fleet-wide `global_speeding`/`idle`/`no_signal` rules
  (zone speeding wins over global to avoid double-firing; idle/no_signal fire once per
  episode), and appends per-entity transmission samples to `db.providerTelemetry`.
  High-frequency map updates bypass Query via `useLiveVehicles()`/`useLiveEvents()`/
  `useLiveProviderTelemetry()` (`useSyncExternalStore`); lists/CRUD use Query.
  `SimulationProvider` exposes pause + speed (1×/4×/16×), surfaced in the topbar.
- **Maps** (`src/components/map/`): `MapsProvider` (APIProvider or graceful fallback),
  `FleetMap` (themed, map-type switcher, right-click coords), and overlays
  (`VehicleMarker`, `GeozoneOverlay`, `RoutePolyline`, `TrailPolyline`, `FollowCamera`,
  `DrawingManager`, `TripPlayback`).
  **All overlays must be rendered as children of `<FleetMap>`** (they use `useMap()`).
- **Shell/auth**: mock auth in `src/auth/` (any credentials, localStorage `ifms.auth`);
  `AppShell` = sidebar (Management + collapsible Configuration groups) + topbar +
  routed `<Outlet>`. Routes in `src/App.tsx` — `/events`, `/providers`,
  `/providers/:id`, `/config/events` joined the original set.
- **Features** (`src/features/<area>/`): `dashboard`, `vehicles`, `drivers`, `events`
  (workspace + `EventRulesPage` at `/config/events`), `providers`, `geozones`,
  `routes`, `auth`. Shared building blocks in `src/components/common/`
  (`DataTable`, `StatCard`, `Sparkline`, status badges, `FormDialog`, `ConfirmDialog`,
  …); provider stats math lives once in `src/lib/provider-stats.ts`.
- **i18n** (`src/i18n/`): react-i18next, English + Amharic (አማርኛ). `index.ts` bootstraps
  i18next (detect/persist via `localStorage["ifms.lang"]`, fallback `en`, `<html lang>`
  sync) and is imported once in `main.tsx`. Strings live in **typed TS resource modules**
  per area: `locales/en/<area>.ts` is the source of truth, `locales/am/<area>.ts` is typed
  `typeof en` so a missing key fails `tsc`; both are assembled in `locales/{en,am}.ts`.
  `i18next.d.ts` makes `t()` keys type-safe (`TranslationKey` from `@/i18n` types stored
  keys). Use `const { t } = useTranslation()` in components; in plain `.ts` helpers
  translate via the `i18n` singleton (see `src/lib/format.ts`, `status.ts`, `csv.ts`).
  Render enum labels with `` t(`enums.<group>.${value}`) `` (config in `status.ts` keeps
  only colors). Amharic uses the Ethiopic-capable Noto font fallback (`index.css`) and
  `Intl` for dates/relative-times. Switcher: `LanguageSwitcher` in the topbar. Dummy seed
  data stays English by design; see `src/i18n/REVIEW.md` for terms needing a native pass.

## Conventions

- Code style: no semicolons, double quotes, 2-space indent; merge classes with `cn()`
  from `@/lib/utils`. Import via the `@/*` alias.
- Deactivated routes reject **new** assignments (enforced in
  `api.assignVehiclesToRoute`, which throws; callers guard + toast).
- **Lint**: `npm run lint` is clean (0 errors). The React-Compiler rules
  `react-hooks/set-state-in-effect` and `react-hooks/purity` are set to **warn** in
  `eslint.config.js` because they fire on intentional patterns (form-reset-on-open,
  URL-param→selection sync, time-based counts); `react-refresh/only-export-components`
  is off for the vendored `src/components/ui/` directory.
