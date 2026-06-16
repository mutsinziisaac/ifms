// TanStack Query hooks over the mock API, plus two live hooks that bypass
// Query for high-frequency map updates (they re-render off the store version
// via useSyncExternalStore).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"

import * as api from "./api"
import type {
  DriverInput,
  EventRuleInput,
  GeozoneInput,
  LogMaintenanceServiceInput,
  MaintenanceTaskInput,
  RouteInput,
  VehicleInput,
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

export function useMaintenanceTasks() {
  return useQuery({
    queryKey: qk.maintenanceTasks,
    queryFn: api.listMaintenanceTasks,
  })
}

export function useMaintenanceServiceRecords(taskId?: string) {
  return useQuery({
    queryKey: taskId
      ? qk.maintenanceServiceRecordsForTask(taskId)
      : qk.maintenanceServiceRecords,
    queryFn: () => api.listMaintenanceServiceRecords(taskId),
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks — each invalidates every key its api call can affect.
// ---------------------------------------------------------------------------

// Vehicle mutations also affect drivers (bidirectional link), maintenance
// tasks (vehicle states), and routes (route assignment).
function invalidateVehicleScope(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: qk.vehicles })
  qc.invalidateQueries({ queryKey: qk.drivers })
  qc.invalidateQueries({ queryKey: qk.maintenanceTasks })
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

export function useCreateMaintenanceTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MaintenanceTaskInput) =>
      api.createMaintenanceTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.maintenanceTasks })
    },
  })
}

export function useUpdateMaintenanceTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; patch: Partial<MaintenanceTaskInput> }) =>
      api.updateMaintenanceTask(vars.id, vars.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.maintenanceTasks })
    },
  })
}

export function useDeleteMaintenanceTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteMaintenanceTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.maintenanceTasks })
    },
  })
}

export function useConfirmMaintenanceTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { taskId: string; vehicleIds?: string[] }) =>
      api.confirmMaintenanceTask(vars.taskId, vars.vehicleIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.maintenanceTasks })
      qc.invalidateQueries({ queryKey: qk.maintenanceServiceRecords })
    },
  })
}

export function useLogMaintenanceService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LogMaintenanceServiceInput) =>
      api.logMaintenanceService(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.maintenanceTasks })
      qc.invalidateQueries({ queryKey: qk.maintenanceServiceRecords })
    },
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
