import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  Check,
  MapPin,
  Route as RouteIcon,
  Trash2,
  Undo2,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/PageHeader"
import { FleetMap } from "@/components/map/FleetMap"
import { RoutePlotter } from "@/components/map/RoutePlotter"
import { RoutePolyline } from "@/components/map/RoutePolyline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useCreateRoute, useRoutes, useUpdateRoute } from "@/data/hooks"
import type { LatLng } from "@/data/types"
import { formatKm } from "@/lib/format"
import { boundsOf, padBounds, pathLengthKm, type GeoBounds } from "@/lib/maps"

const MUTED_COLOR = "#94a3b8"

/**
 * Full-page route editor: plot the corridor on a large map (click to drop
 * vertices) while filling in its details in the side panel. Mounted at
 * `/routes/new` (create) and `/routes/:id/edit` (edit, mock-only). The plotting
 * itself is native — see RoutePlotter — since Google removed the drawing library
 * in Maps JS v3.65.
 */
export function RouteEditorPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = id !== undefined

  const routesQuery = useRoutes()
  const routes = useMemo(() => routesQuery.data ?? [], [routesQuery.data])
  const createRoute = useCreateRoute()
  const updateRoute = useUpdateRoute()
  const isPending = createRoute.isPending || updateRoute.isPending

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startAddress, setStartAddress] = useState("")
  const [endAddress, setEndAddress] = useState("")
  const [active, setActive] = useState(true)
  const [points, setPoints] = useState<LatLng[]>([])
  const hydratedRef = useRef(false)

  // Hydrate from the edited route once the list has loaded. Seeds the vertices
  // from the route's waypoints (clean handful of points) rather than the dense
  // render path.
  useEffect(() => {
    if (!isEdit || hydratedRef.current) return
    const route = routes.find((r) => r.id === id)
    if (!route) return
    const waypoints = route.waypoints
    setName(route.name)
    setDescription(route.description)
    setStartAddress(route.startAddress ?? waypoints[0]?.name ?? "")
    setEndAddress(
      route.endAddress ?? waypoints[waypoints.length - 1]?.name ?? ""
    )
    setActive(route.active)
    setPoints(waypoints.map((w) => w.position))
    hydratedRef.current = true
  }, [isEdit, id, routes])

  const addPoint = useCallback(
    (point: LatLng) => setPoints((prev) => [...prev, point]),
    []
  )

  // Other corridors, drawn muted for spatial context while plotting.
  const otherRoutes = useMemo(
    () => routes.filter((r) => r.id !== id && r.path.length >= 2),
    [routes, id]
  )

  // Fit once to the edited route; create starts at the default corridor view.
  // Independent of `points` so the camera stays put while plotting.
  const initialBounds = useMemo<GeoBounds | null>(() => {
    if (!isEdit) return null
    const route = routes.find((r) => r.id === id)
    const b = route ? boundsOf(route.path) : null
    return b ? padBounds(b, 0.3) : null
  }, [isEdit, id, routes])

  const distanceKm = pathLengthKm(points)
  const hasPath = points.length >= 2

  const handleSave = () => {
    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      toast.error(t("routes.toast.nameRequired"))
      return
    }
    if (!hasPath) {
      toast.error(t("routes.toast.pathRequired"))
      return
    }

    const input = {
      name: trimmedName,
      description: description.trim(),
      path: points,
      startAddress: startAddress.trim(),
      endAddress: endAddress.trim(),
      active,
    }

    if (isEdit && id) {
      updateRoute.mutate(
        { id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("routes.toast.updated", { name: trimmedName }))
            navigate(`/routes?id=${id}`)
          },
          onError: (error: Error) => toast.error(error.message),
        }
      )
    } else {
      createRoute.mutate(input, {
        onSuccess: (created) => {
          toast.success(t("routes.toast.created", { name: trimmedName }))
          navigate(`/routes?id=${created.id}`)
        },
        onError: (error: Error) => toast.error(error.message),
      })
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[560px] flex-col">
      <PageHeader
        title={
          isEdit ? t("routes.editor.editTitle") : t("routes.editor.createTitle")
        }
        description={
          isEdit
            ? t("routes.editor.editDescription")
            : t("routes.editor.createDescription")
        }
        actions={
          <Button variant="ghost" onClick={() => navigate("/routes")}>
            <ArrowLeft className="size-4" />
            {t("common.back")}
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left: details */}
        <div className="flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border bg-card">
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 p-4">
              <div className="space-y-2">
                <Label htmlFor="route-name">{t("forms.name")}</Label>
                <Input
                  id="route-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("routes.form.namePlaceholder")}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route-start">
                  {t("routes.form.startAddress")}
                </Label>
                <Input
                  id="route-start"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                  placeholder={t("routes.form.startAddressPlaceholder")}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route-end">{t("routes.form.endAddress")}</Label>
                <Input
                  id="route-end"
                  value={endAddress}
                  onChange={(e) => setEndAddress(e.target.value)}
                  placeholder={t("routes.form.endAddressPlaceholder")}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="route-description">
                  {t("forms.description")}
                </Label>
                <Textarea
                  id="route-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("routes.form.descriptionPlaceholder")}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
                <div className="space-y-0.5">
                  <Label htmlFor="route-active" className="cursor-pointer">
                    {t("routes.active")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("routes.form.activeHint")}
                  </p>
                </div>
                <Switch
                  id="route-active"
                  checked={active}
                  onCheckedChange={setActive}
                />
              </div>

              {/* Plotted-route summary */}
              <div className="space-y-2">
                <Label className="gap-1.5">
                  <RouteIcon className="size-4 text-muted-foreground" />
                  {t("routes.form.plottedRoute")}
                </Label>
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                  {hasPath ? (
                    <p className="text-sm tabular-nums">
                      {formatKm(distanceKm)} ·{" "}
                      {t("routes.form.points", { count: points.length })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("routes.editor.plotHint")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 border-t p-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/routes")}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isPending}
            >
              <Check className="size-4" />
              {isEdit
                ? t("routes.form.saveChanges")
                : t("routes.form.createRoute")}
            </Button>
          </div>
        </div>

        {/* Right: plotting map */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border">
          <FleetMap
            bounds={initialBounds}
            className="h-full w-full rounded-none"
          >
            {otherRoutes.map((route) => (
              <RoutePolyline
                key={route.id}
                path={route.path}
                color={MUTED_COLOR}
                active={route.active}
              />
            ))}
            <RoutePlotter points={points} onAddPoint={addPoint} />
          </FleetMap>

          {/* Plotting toolbar */}
          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-primary/40 bg-background/95 px-3 py-1.5 shadow-md backdrop-blur">
            <MapPin className="size-3.5 text-primary" />
            <span className="text-xs font-medium">
              {t("routes.map.drawHint")}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("routes.form.points", { count: points.length })}
            </span>
            <span className="mx-0.5 h-4 w-px bg-border" />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={points.length === 0}
              onClick={() => setPoints((prev) => prev.slice(0, -1))}
            >
              <Undo2 className="size-3.5" />
              {t("routes.map.undo")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={points.length === 0}
              onClick={() => setPoints([])}
            >
              <Trash2 className="size-3.5" />
              {t("routes.map.clear")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
