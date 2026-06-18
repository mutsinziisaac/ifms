import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Pencil,
  Plus,
  Route as RouteIcon,
  Search,
  Trash2,
  Truck,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"
import { FleetMap } from "@/components/map/FleetMap"
import { RoutePolyline } from "@/components/map/RoutePolyline"
import { VehicleMarker } from "@/components/map/VehicleMarker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { isRealApi } from "@/data/api"
import {
  useDeleteRoute,
  useGeozones,
  useLiveVehicles,
  useRoutes,
  useSetRouteActive,
} from "@/data/hooks"
import type { RouteDef } from "@/data/types"
import { formatKm } from "@/lib/format"
import { boundsOf, padBounds, type GeoBounds } from "@/lib/maps"
import { cn } from "@/lib/utils"

import { AssignVehiclesDialog } from "./components/AssignVehiclesDialog"
import { RouteDetailPanel } from "./components/RouteDetailPanel"

const SELECTED_COLOR = "#0d9488"
const MUTED_COLOR = "#94a3b8"

type DialogState =
  | { kind: "none" }
  | { kind: "delete"; route: RouteDef }
  | { kind: "assign"; route: RouteDef }

export function RoutesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const routesQuery = useRoutes()
  const routes = useMemo(() => routesQuery.data ?? [], [routesQuery.data])
  const isLoading = routesQuery.isLoading

  const liveVehicles = useLiveVehicles()
  const geozones = useGeozones().data ?? []

  const setActive = useSetRouteActive()

  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" })

  // Deep-link from global search or the editor: /routes?id=... preselects it.
  const [searchParams] = useSearchParams()
  const linkedId = searchParams.get("id")
  useEffect(() => {
    if (linkedId) setSelectedId(linkedId)
  }, [linkedId])

  const geozoneName = useMemo(() => {
    const map = new Map(geozones.map((z) => [z.id, z.name]))
    return (id: string | null) => (id ? map.get(id) : undefined)
  }, [geozones])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q.length === 0) return routes
    return routes.filter((route) => {
      if (route.name.toLowerCase().includes(q)) return true
      if (route.description.toLowerCase().includes(q)) return true
      return route.waypoints.some((w) => w.name.toLowerCase().includes(q))
    })
  }, [routes, search])

  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedId) ?? null,
    [routes, selectedId]
  )

  // Fit the map to the selected route, or to all routes when none is selected.
  const bounds = useMemo<GeoBounds | null>(() => {
    const points = selectedRoute
      ? selectedRoute.path
      : routes.flatMap((r) => r.path)
    const b = boundsOf(points)
    return b ? padBounds(b, 0.15) : null
  }, [selectedRoute, routes])

  // Live vehicles running the selected corridor — the "trucks on the road".
  const corridorVehicles = useMemo(() => {
    if (!selectedRoute) return []
    return liveVehicles.filter((v) => v.routeId === selectedRoute.id)
  }, [liveVehicles, selectedRoute])

  const closeDialog = () => setDialog({ kind: "none" })

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[560px] flex-col">
      <PageHeader
        title={t("routes.title")}
        description={t("routes.description")}
        actions={
          <Button onClick={() => navigate("/routes/new")}>
            <Plus className="size-4" />
            {t("routes.addRoute")}
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left: route list + detail */}
        <div className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("routes.searchPlaceholder")}
                className="pl-8"
                autoComplete="off"
              />
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={RouteIcon}
                title={
                  routes.length === 0
                    ? t("routes.empty.noRoutesTitle")
                    : t("routes.empty.noMatchTitle")
                }
                description={
                  routes.length === 0
                    ? t("routes.empty.noRoutesDescription")
                    : t("routes.empty.noMatchDescription")
                }
                action={
                  routes.length === 0 ? (
                    <Button size="sm" onClick={() => navigate("/routes/new")}>
                      <Plus className="size-4" />
                      {t("routes.addRoute")}
                    </Button>
                  ) : undefined
                }
                className="py-16"
              />
            ) : (
              <ul className="space-y-1.5 p-3">
                {filtered.map((route) => {
                  const isSelected = route.id === selectedId
                  return (
                    <li
                      key={route.id}
                      className={cn(
                        "overflow-hidden rounded-lg border transition-colors",
                        isSelected
                          ? "border-primary/30 bg-primary/5"
                          : "border-transparent hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setSelectedId(isSelected ? null : route.id)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setSelectedId(isSelected ? null : route.id)
                          }
                        }}
                        className="cursor-pointer px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{route.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                              {formatKm(route.distanceKm)} ·{" "}
                              {t("routes.list.stops", {
                                count: route.waypoints.length,
                              })}
                            </p>
                          </div>
                          <Badge
                            variant={route.active ? "default" : "secondary"}
                            className={cn(
                              "shrink-0",
                              !route.active && "text-muted-foreground"
                            )}
                          >
                            {route.active
                              ? t("routes.active")
                              : t("routes.inactive")}
                          </Badge>
                        </div>

                        {!isRealApi ? (
                          <div
                            className="mt-2.5 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="mr-auto flex items-center gap-1.5">
                              <Switch
                                size="sm"
                                checked={route.active}
                                onCheckedChange={(checked) =>
                                  setActive.mutate(
                                    { id: route.id, active: checked },
                                    {
                                      onSuccess: () =>
                                        toast.success(
                                          checked
                                            ? t("routes.toast.activated", {
                                                name: route.name,
                                              })
                                            : t("routes.toast.deactivated", {
                                                name: route.name,
                                              })
                                        ),
                                      onError: (error: Error) =>
                                        toast.error(error.message),
                                    }
                                  )
                                }
                                aria-label={t("routes.list.toggleActive")}
                              />
                              <span className="text-xs text-muted-foreground">
                                {route.active
                                  ? t("routes.active")
                                  : t("routes.inactive")}
                              </span>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setDialog({ kind: "assign", route })
                              }
                              aria-label={t("routes.list.assignVehicles")}
                              title={t("routes.list.assignVehicles")}
                            >
                              <Truck className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => navigate(`/routes/${route.id}/edit`)}
                              aria-label={t("routes.list.editRoute")}
                              title={t("routes.list.editRoute")}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                setDialog({ kind: "delete", route })
                              }
                              aria-label={t("routes.list.deleteRoute")}
                              title={t("routes.list.deleteRoute")}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {isSelected ? <RouteDetailPanel route={route} /> : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        {/* Right: map */}
        <div className="min-w-0 flex-1 overflow-hidden rounded-xl border">
          <FleetMap bounds={bounds} className="h-full w-full rounded-none">
            {routes.map((route) => {
              const isSelected = route.id === selectedId
              if (route.path.length < 2) return null
              return (
                <RoutePolyline
                  key={route.id}
                  path={route.path}
                  color={isSelected ? SELECTED_COLOR : MUTED_COLOR}
                  active={route.active}
                  selected={isSelected}
                  waypoints={route.waypoints}
                  showWaypoints={isSelected}
                  onClick={() => setSelectedId(route.id)}
                />
              )
            })}

            {corridorVehicles.map((vehicle) => (
              <VehicleMarker
                key={vehicle.id}
                vehicle={vehicle}
                geozoneName={geozoneName(vehicle.insideGeozoneId)}
                onClick={() => setSelectedId(vehicle.routeId)}
              />
            ))}
          </FleetMap>
        </div>
      </div>

      {/* Dialogs */}
      {dialog.kind === "assign" ? (
        <AssignVehiclesDialog
          open
          onOpenChange={(open) => !open && closeDialog()}
          route={dialog.route}
        />
      ) : null}
      {dialog.kind === "delete" ? (
        <DeleteRouteDialog
          route={dialog.route}
          onClose={closeDialog}
          onDeleted={(id) => {
            if (selectedId === id) setSelectedId(null)
          }}
        />
      ) : null}
    </div>
  )
}

function DeleteRouteDialog({
  route,
  onClose,
  onDeleted,
}: {
  route: RouteDef
  onClose: () => void
  onDeleted: (id: string) => void
}) {
  const { t } = useTranslation()
  const deleteRoute = useDeleteRoute()
  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("routes.delete.title")}
      description={t("routes.delete.description", { name: route.name })}
      confirmLabel={t("routes.delete.confirm")}
      destructive
      isPending={deleteRoute.isPending}
      onConfirm={() =>
        deleteRoute.mutate(route.id, {
          onSuccess: () => {
            toast.success(t("routes.toast.deleted", { name: route.name }))
            onDeleted(route.id)
            onClose()
          },
          onError: (error: Error) => toast.error(error.message),
        })
      }
    />
  )
}
