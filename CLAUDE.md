# IFMS — Integrated Fleet Management System (prototype)

A high-fidelity, **demo prototype** for the Ministry of Transport & Logistics (MoTL)
Ethiopia to monitor vehicles operated by **other entities** (transport/logistics
companies) along the Addis Ababa–Djibouti corridor. All data is dummy and lives in an
in-memory store — there is no backend.

Scope (per `ver.2 SRS Document 11.10.2024.docx`): Driver Management, Vehicle/Fleet
Management, Geozone Management, Routes Management, Maintenance Management, plus a mock
login and an overview dashboard.

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
  Ethiopian dummy data: 9 entities, 48 vehicles, 36 drivers, 12 geozones, 6 routes, 6
  maintenance tasks) → `store.ts` (in-memory singleton DB + `subscribe`/`mutate`) →
  `api.ts` (async mock API with fake latency) → `hooks.ts` (TanStack Query hooks +
  mutations that cross-invalidate). `query-keys.ts` centralizes keys.
- **Live simulation** (`src/sim/`): `simulation.ts` ticks every 1.5s — moves vehicles
  along route polylines, flips statuses, and fires geofence entry/exit/speeding alerts
  for **active** alert rules. High-frequency map updates bypass Query via
  `useLiveVehicles()`/`useLiveAlerts()` (`useSyncExternalStore`); lists/CRUD use Query.
  `SimulationProvider` exposes pause + speed (1×/4×/16×), surfaced in the topbar.
- **Maps** (`src/components/map/`): `MapsProvider` (APIProvider or graceful fallback),
  `FleetMap` (themed, map-type switcher, right-click coords), and overlays
  (`VehicleMarker`, `GeozoneOverlay`, `RoutePolyline`, `DrawingManager`, `TripPlayback`).
  **All overlays must be rendered as children of `<FleetMap>`** (they use `useMap()`).
- **Shell/auth**: mock auth in `src/auth/` (any credentials, localStorage `ifms.auth`);
  `AppShell` = sidebar + topbar + routed `<Outlet>`. Routes in `src/App.tsx`.
- **Features** (`src/features/<area>/`): `dashboard`, `vehicles`, `drivers`, `geozones`,
  `routes`, `maintenance`, `auth`. Shared building blocks in `src/components/common/`
  (`DataTable`, `StatCard`, status badges, `FormDialog`, `ConfirmDialog`, …).

## Conventions

- Code style: no semicolons, double quotes, 2-space indent; merge classes with `cn()`
  from `@/lib/utils`. Import via the `@/*` alias.
- The SRS maintenance status rule (OK > 20% interval remaining, Waiting ≤ 20%, Delay
  overdue) lives in `computeMaintenanceState` (`src/lib/status.ts`) — consume it, never
  reimplement. Deactivated routes reject **new** assignments (enforced in
  `api.assignVehiclesToRoute`, which throws; callers guard + toast).
- **Lint**: `npm run lint` is clean (0 errors). The React-Compiler rules
  `react-hooks/set-state-in-effect` and `react-hooks/purity` are set to **warn** in
  `eslint.config.js` because they fire on intentional patterns (form-reset-on-open,
  URL-param→selection sync, time-based counts); `react-refresh/only-export-components`
  is off for the vendored `src/components/ui/` directory.
