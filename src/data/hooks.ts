// TanStack Query hooks over the mock API, plus two live hooks that bypass
// Query for high-frequency map updates (they re-render off the store version
// via useSyncExternalStore).

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useSyncExternalStore } from "react"

import * as api from "./api"
import type {
  AccidentInput,
  AlertListParams,
  EventRuleInput,
  GeozoneInput,
  RoleInput,
  RouteInput,
  VehicleInput,
  WebUserInput,
} from "./api"
import type { ApiPagination } from "@/lib/http"
import { qk } from "./query-keys"
import { getDB, getVersion, subscribe } from "./store"
import type {
  FleetEvent,
  ItmsVerificationStatus,
  LatLng,
  ProviderTelemetry,
  Vehicle,
} from "./types"

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useEntities() {
  return useQuery({ queryKey: qk.entities, queryFn: api.listEntities })
}

export function useProviders() {
  return useQuery({ queryKey: qk.providers, queryFn: api.listProviders })
}

export function useVehicles(verification?: ItmsVerificationStatus) {
  return useQuery({
    queryKey: qk.vehiclesList(verification),
    queryFn: () => api.listVehicles(verification),
  })
}

/** The Fleet page's verification queue (GET /vehicles?filter=verification). */
export function useVerificationVehicles() {
  return useQuery({
    queryKey: qk.vehiclesVerification,
    queryFn: api.listVerificationVehicles,
  })
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: qk.vehicle(id ?? ""),
    queryFn: () => api.getVehicle(id!),
    enabled: !!id,
  })
}

export function useGeozones() {
  return useQuery({ queryKey: qk.geozones, queryFn: api.listGeozones })
}

export function useGeozoneGroups() {
  return useQuery({
    queryKey: qk.geozoneGroups,
    queryFn: api.listGeozoneGroups,
  })
}

export function useEventRules() {
  return useQuery({ queryKey: qk.eventRules, queryFn: api.listEventRules })
}

export function useEvents() {
  return useQuery({ queryKey: qk.events, queryFn: api.listEvents })
}

export function useRoutes() {
  return useQuery({ queryKey: qk.routes, queryFn: api.listRoutes })
}

export function useTripsForVehicle(vehicleId: string | undefined) {
  return useQuery({
    queryKey: qk.tripsForVehicle(vehicleId ?? ""),
    queryFn: () => api.listTripsForVehicle(vehicleId!),
    enabled: !!vehicleId,
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks — each invalidates every key its api call can affect.
// ---------------------------------------------------------------------------

// Vehicle mutations also affect routes (route assignment).
function invalidateVehicleScope(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.vehicles })
  qc.invalidateQueries({ queryKey: qk.routes })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VehicleInput) => api.createVehicle(input),
    onSuccess: () => invalidateVehicleScope(qc),
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<VehicleInput> }) =>
      api.updateVehicle(vars.id, vars.patch),
    onSuccess: (_data, vars) => {
      invalidateVehicleScope(qc)
      qc.invalidateQueries({ queryKey: qk.vehicle(vars.id) })
    },
  })
}

export function useDeleteVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteVehicle(id),
    onSuccess: () => invalidateVehicleScope(qc),
  })
}

// Geozone mutations also affect event rules and vehicles (insideGeozoneId).
function invalidateGeozoneScope(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.geozones })
  qc.invalidateQueries({ queryKey: qk.eventRules })
  qc.invalidateQueries({ queryKey: qk.vehicles })
}

export function useCreateGeozone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GeozoneInput) => api.createGeozone(input),
    onSuccess: () => invalidateGeozoneScope(qc),
  })
}

export function useUpdateGeozone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<GeozoneInput> }) =>
      api.updateGeozone(vars.id, vars.patch),
    onSuccess: () => invalidateGeozoneScope(qc),
  })
}

export function useDeleteGeozone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteGeozone(id),
    onSuccess: () => invalidateGeozoneScope(qc),
  })
}

export function useImportGeozones() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (zones: { name: string; points: LatLng[] }[]) =>
      api.importGeozones(zones),
    onSuccess: () => invalidateGeozoneScope(qc),
  })
}

export function useCreateGeozoneGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; color: string }) =>
      api.createGeozoneGroup(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.geozoneGroups })
    },
  })
}

export function useUpdateGeozoneGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      id: string
      patch: Partial<{ name: string; color: string }>
    }) => api.updateGeozoneGroup(vars.id, vars.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.geozoneGroups })
      qc.invalidateQueries({ queryKey: qk.geozones })
    },
  })
}

export function useDeleteGeozoneGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteGeozoneGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.geozoneGroups })
      qc.invalidateQueries({ queryKey: qk.geozones })
    },
  })
}

export function useUpsertEventRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: EventRuleInput) => api.upsertEventRule(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.eventRules })
    },
  })
}

/** Toggle a rule via the backend's activate/deactivate action endpoints. */
export function useSetEventRuleActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.setEventRuleActive(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.eventRules })
    },
  })
}

export function useDeleteEventRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteEventRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.eventRules })
    },
  })
}

// Event workflow mutations refresh both the legacy ["events"] consumers
// (notifications bell, reports, vehicle/provider cards) and every Alerts-page
// ["alerts"] list/count query (real backend) so the page reflects the new status.
function invalidateEventScope(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.events })
  qc.invalidateQueries({ queryKey: ["alerts"] })
}

export function useMarkAllEventsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.markAllEventsRead(),
    onSuccess: () => invalidateEventScope(qc),
  })
}

export function useAcknowledgeEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; by: string }) =>
      api.acknowledgeEvent(vars.id, vars.by),
    onSuccess: () => invalidateEventScope(qc),
  })
}

export function useEscalateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; to: string; by: string }) =>
      api.escalateEvent(vars.id, { to: vars.to, by: vars.by }),
    onSuccess: () => invalidateEventScope(qc),
  })
}

export function useCloseEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; by: string; note: string }) =>
      api.closeEvent(vars.id, { by: vars.by, note: vars.note }),
    onSuccess: () => invalidateEventScope(qc),
  })
}

// Route mutations also affect vehicles (route assignment / clearing).
function invalidateRouteScope(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.routes })
  qc.invalidateQueries({ queryKey: qk.vehicles })
}

export function useCreateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RouteInput) => api.createRoute(input),
    onSuccess: () => invalidateRouteScope(qc),
  })
}

export function useUpdateRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<RouteInput> }) =>
      api.updateRoute(vars.id, vars.patch),
    onSuccess: () => invalidateRouteScope(qc),
  })
}

export function useDeleteRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteRoute(id),
    onSuccess: () => invalidateRouteScope(qc),
  })
}

export function useSetRouteActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; active: boolean }) =>
      api.setRouteActive(vars.id, vars.active),
    onSuccess: () => invalidateRouteScope(qc),
  })
}

export function useAssignVehiclesToRoute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { routeId: string; vehicleIds: string[] }) =>
      api.assignVehiclesToRoute(vars.routeId, vars.vehicleIds),
    onSuccess: () => invalidateRouteScope(qc),
  })
}

// ---------------------------------------------------------------------------
// Accidents / incidents
// ---------------------------------------------------------------------------

export function useAccidents() {
  return useQuery({ queryKey: qk.accidents, queryFn: api.listAccidents })
}

export function useCreateAccident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: AccidentInput) => api.createAccident(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.accidents }),
  })
}

export function useUpdateAccident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<AccidentInput> }) =>
      api.updateAccident(vars.id, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.accidents }),
  })
}

export function useDeleteAccident() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAccident(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.accidents }),
  })
}

// ---------------------------------------------------------------------------
// Roles & web users (RBAC management). Role and user lists reference each
// other (role names in the user table, user counts in the role table), so
// every mutation refreshes both.
// ---------------------------------------------------------------------------

function invalidateRbac(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.roles })
  qc.invalidateQueries({ queryKey: qk.webUsers })
}

export function useRoles() {
  return useQuery({ queryKey: qk.roles, queryFn: api.listRoles })
}

export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RoleInput) => api.createRole(input),
    onSuccess: () => invalidateRbac(qc),
  })
}

export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<RoleInput> }) =>
      api.updateRole(vars.id, vars.patch),
    onSuccess: () => invalidateRbac(qc),
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteRole(id),
    onSuccess: () => invalidateRbac(qc),
  })
}

export function useWebUsers() {
  return useQuery({ queryKey: qk.webUsers, queryFn: api.listWebUsers })
}

export function useCreateWebUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: WebUserInput) => api.createWebUser(input),
    onSuccess: () => invalidateRbac(qc),
  })
}

export function useUpdateWebUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<WebUserInput> }) =>
      api.updateWebUser(vars.id, vars.patch),
    onSuccess: () => invalidateRbac(qc),
  })
}

export function useDeleteWebUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteWebUser(id),
    onSuccess: () => invalidateRbac(qc),
  })
}

// ---------------------------------------------------------------------------
// Live hooks — bypass Query for high-frequency map updates. The version
// number is the snapshot; we read the store in render.
// ---------------------------------------------------------------------------

// Mock mode: re-render off the simulation-driven store version.
function useSimulatedLiveVehicles(): Vehicle[] {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  return getDB().vehicles
}

// Real backend: poll the /vehicles/map snapshot. The verification stream patches
// this cache (see verification-stream.ts) for instant updates between polls.
function usePolledLiveVehicles(): Vehicle[] {
  const { data } = useQuery({
    queryKey: qk.vehiclesMap,
    queryFn: api.listVehiclesMap,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
    // Polls every 4s — don't spam the global error toast on each failure (e.g.
    // before login / missing permission); the map just shows no vehicles.
    meta: { suppressGlobalError: true },
  })
  return data ?? []
}

// Pick the implementation once at module load — `isRealApi` is a build-time
// constant, so the hook identity is stable (no conditional-hook violation).
export const useLiveVehicles: () => Vehicle[] = api.isRealApi
  ? usePolledLiveVehicles
  : useSimulatedLiveVehicles

export function useLiveEvents(limit?: number): FleetEvent[] {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  const events = getDB().events
  return limit === undefined ? events : events.slice(0, limit)
}

export function useLiveProviderTelemetry(): ProviderTelemetry[] {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  return getDB().providerTelemetry
}

// ---------------------------------------------------------------------------
// Alerts page — server-side filtered + paginated feed (GET /api/v1/alerts).
// Two implementations picked once at module load by `isRealApi` (same pattern as
// useLiveVehicles): real mode queries the backend page; mock mode reads the
// simulation store live and applies the same filter/pagination via
// api.selectAlertPage, so the page code path is identical in both modes.
// ---------------------------------------------------------------------------

export interface AlertsFeed {
  events: FleetEvent[]
  pagination: ApiPagination | null
  isLoading: boolean
}

function useQueriedAlertsFeed(params: AlertListParams): AlertsFeed {
  const query = useQuery({
    queryKey: qk.alerts(params),
    queryFn: () => api.listAlerts(params),
    // Keep the previous page visible while the next page/filter loads (no flicker).
    placeholderData: (prev) => prev,
  })
  return {
    events: query.data?.events ?? [],
    pagination: query.data?.pagination ?? null,
    isLoading: query.isLoading,
  }
}

function useSimulatedAlertsFeed(params: AlertListParams): AlertsFeed {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  const page = api.selectAlertPage(getDB().events, params)
  return { events: page.events, pagination: page.pagination, isLoading: false }
}

export const useAlertsFeed: (params: AlertListParams) => AlertsFeed =
  api.isRealApi ? useQueriedAlertsFeed : useSimulatedAlertsFeed

export interface AlertCounts {
  open: number
  acknowledged: number
  resolved: number
  total: number
}

function useQueriedAlertCounts(): AlertCounts {
  const results = useQueries({
    queries: [
      { queryKey: qk.alertCounts("OPEN"), queryFn: () => api.countAlerts("OPEN") },
      {
        queryKey: qk.alertCounts("ACKNOWLEDGED"),
        queryFn: () => api.countAlerts("ACKNOWLEDGED"),
      },
      {
        queryKey: qk.alertCounts("RESOLVED"),
        queryFn: () => api.countAlerts("RESOLVED"),
      },
      { queryKey: qk.alertCounts(), queryFn: () => api.countAlerts() },
    ],
  })
  return {
    open: results[0].data ?? 0,
    acknowledged: results[1].data ?? 0,
    resolved: results[2].data ?? 0,
    total: results[3].data ?? 0,
  }
}

function useSimulatedAlertCounts(): AlertCounts {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  const events = getDB().events
  return {
    open: events.filter((e) => e.status === "open").length,
    acknowledged: events.filter((e) => e.status === "acknowledged").length,
    resolved: events.filter((e) => e.status === "closed").length,
    total: events.length,
  }
}

export const useAlertCounts: () => AlertCounts = api.isRealApi
  ? useQueriedAlertCounts
  : useSimulatedAlertCounts
