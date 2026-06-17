// TanStack Query hooks over the mock API, plus two live hooks that bypass
// Query for high-frequency map updates (they re-render off the store version
// via useSyncExternalStore).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"

import * as api from "./api"
import type {
  AccidentInput,
  DriverInput,
  EventRuleInput,
  GeozoneInput,
  RoleInput,
  RouteInput,
  VehicleInput,
  WebUserInput,
} from "./api"
import { qk } from "./query-keys"
import { getDB, getVersion, subscribe } from "./store"
import type { FleetEvent, LatLng, ProviderTelemetry, Vehicle } from "./types"

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useEntities() {
  return useQuery({ queryKey: qk.entities, queryFn: api.listEntities })
}

export function useVehicles() {
  return useQuery({ queryKey: qk.vehicles, queryFn: api.listVehicles })
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: qk.vehicle(id ?? ""),
    queryFn: () => api.getVehicle(id!),
    enabled: !!id,
  })
}

export function useDrivers() {
  return useQuery({ queryKey: qk.drivers, queryFn: api.listDrivers })
}

export function useDriver(id: string | undefined) {
  return useQuery({
    queryKey: qk.driver(id ?? ""),
    queryFn: () => api.getDriver(id!),
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

export function useAssignmentsForVehicle(vehicleId: string | undefined) {
  return useQuery({
    queryKey: qk.assignmentsForVehicle(vehicleId ?? ""),
    queryFn: () => api.listAssignmentsForVehicle(vehicleId!),
    enabled: !!vehicleId,
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks — each invalidates every key its api call can affect.
// ---------------------------------------------------------------------------

// Vehicle mutations also affect drivers (bidirectional link) and routes
// (route assignment).
function invalidateVehicleScope(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.vehicles })
  qc.invalidateQueries({ queryKey: qk.drivers })
  qc.invalidateQueries({ queryKey: qk.routes })
  qc.invalidateQueries({ queryKey: qk.assignments })
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

// Driver mutations also affect vehicles (bidirectional link).
function invalidateDriverScope(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.drivers })
  qc.invalidateQueries({ queryKey: qk.vehicles })
  qc.invalidateQueries({ queryKey: qk.assignments })
}

export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: DriverInput) => api.createDriver(input),
    onSuccess: () => invalidateDriverScope(qc),
  })
}

export function useUpdateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<DriverInput> }) =>
      api.updateDriver(vars.id, vars.patch),
    onSuccess: (_data, vars) => {
      invalidateDriverScope(qc)
      qc.invalidateQueries({ queryKey: qk.driver(vars.id) })
    },
  })
}

export function useDeleteDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteDriver(id),
    onSuccess: () => invalidateDriverScope(qc),
  })
}

export function useAssignVehicleToDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { driverId: string; vehicleId: string | null }) =>
      api.assignVehicleToDriver(vars.driverId, vars.vehicleId),
    onSuccess: (_data, vars) => {
      invalidateDriverScope(qc)
      qc.invalidateQueries({ queryKey: qk.driver(vars.driverId) })
    },
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

export function useDeleteEventRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteEventRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.eventRules })
    },
  })
}

export function useMarkAllEventsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.markAllEventsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.events })
    },
  })
}

export function useAcknowledgeEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; by: string }) =>
      api.acknowledgeEvent(vars.id, vars.by),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.events })
    },
  })
}

export function useEscalateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; to: string; by: string }) =>
      api.escalateEvent(vars.id, { to: vars.to, by: vars.by }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.events })
    },
  })
}

export function useCloseEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; by: string; note: string }) =>
      api.closeEvent(vars.id, { by: vars.by, note: vars.note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.events })
    },
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

export function useLiveVehicles(): Vehicle[] {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  return getDB().vehicles
}

export function useLiveEvents(limit?: number): FleetEvent[] {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  const events = getDB().events
  return limit === undefined ? events : events.slice(0, limit)
}

export function useLiveProviderTelemetry(): ProviderTelemetry[] {
  useSyncExternalStore(subscribe, getVersion, getVersion)
  return getDB().providerTelemetry
}
