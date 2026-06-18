import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  Check,
  Circle as CircleIcon,
  Hexagon,
  MapPin,
  Trash2,
  Undo2,
} from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/layout/PageHeader"
import { FleetMap } from "@/components/map/FleetMap"
import { GeozoneOverlay } from "@/components/map/GeozoneOverlay"
import { GeozonePlotter } from "@/components/map/GeozonePlotter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isRealApi, type GeozoneInput } from "@/data/api"
import {
  useCreateGeozone,
  useGeozoneGroups,
  useGeozones,
  useUpdateGeozone,
} from "@/data/hooks"
import type { Geozone, GeozoneShape, LatLng } from "@/data/types"
import {
  DEFAULT_GEOZONE_COLOR,
  GEOZONE_GROUP_COLORS,
} from "@/lib/geozone-colors"
import { boundsOf, centroidOf, padBounds, type GeoBounds } from "@/lib/maps"
import { cn } from "@/lib/utils"

const NO_GROUP = "__none__"
const MUTED_COLOR = "#94a3b8"

type Circle = { center: LatLng; radiusM: number }

/**
 * Full-page geozone editor: plot the geofence on a large map while filling in
 * its details in the side panel. Mounted at `/geozones/new` (create) and
 * `/geozones/:id/edit` (edit, mock-only). Mirrors RouteEditorPage — plotting is
 * native (see GeozonePlotter) since Google removed the drawing library in Maps
 * JS v3.65. Circles: click the centre, then click the edge. Polygons: click to
 * drop each vertex; the Save button finishes the shape.
 */
export function GeozoneEditorPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = id !== undefined

  const geozonesQuery = useGeozones()
  const geozones = useMemo(
    () => geozonesQuery.data ?? [],
    [geozonesQuery.data]
  )
  const groups = useGeozoneGroups().data ?? []
  const createGeozone = useCreateGeozone()
  const updateGeozone = useUpdateGeozone()
  const isPending = createGeozone.isPending || updateGeozone.isPending

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [note, setNote] = useState("")
  const [color, setColor] = useState(DEFAULT_GEOZONE_COLOR)
  const [groupId, setGroupId] = useState(NO_GROUP)
  const [shape, setShape] = useState<GeozoneShape>("circle")
  const [points, setPoints] = useState<LatLng[]>([]) // polygon vertices
  const [circle, setCircle] = useState<Circle | null>(null)
  // Bump to remount the plotter (resets its in-progress shape) when redrawing or
  // switching shape — so a committed circle stops following the cursor.
  const [plotterKey, setPlotterKey] = useState(0)
  const hydratedRef = useRef(false)

  // Hydrate from the edited zone once the list has loaded.
  useEffect(() => {
    if (!isEdit || hydratedRef.current) return
    const zone = geozones.find((z) => z.id === id)
    if (!zone) return
    setName(zone.name)
    setAddress(zone.address)
    setNote(zone.note)
    setColor(zone.color ?? DEFAULT_GEOZONE_COLOR)
    setGroupId(zone.groupId ?? NO_GROUP)
    setShape(zone.shape)
    if (zone.shape === "circle" && zone.radiusM != null) {
      setCircle({ center: zone.center, radiusM: zone.radiusM })
    } else if (zone.shape === "polygon" && zone.path) {
      setPoints(zone.path)
    }
    hydratedRef.current = true
  }, [isEdit, id, geozones])

  const addPoint = useCallback(
    (point: LatLng) => setPoints((prev) => [...prev, point]),
    []
  )

  const handleCircleComplete = useCallback((center: LatLng, radiusM: number) => {
    setCircle({ center, radiusM })
    setPlotterKey((k) => k + 1)
  }, [])

  const switchShape = (next: GeozoneShape) => {
    if (next === shape || isEdit) return
    setShape(next)
    setPoints([])
    setCircle(null)
    setPlotterKey((k) => k + 1)
  }

  const redrawCircle = () => {
    setCircle(null)
    setPlotterKey((k) => k + 1)
  }

  // Other zones, drawn muted for spatial context while plotting.
  const otherZones = useMemo(
    () => geozones.filter((z) => z.id !== id),
    [geozones, id]
  )

  // Fit once to the edited zone; create starts at the default corridor view.
  const initialBounds = useMemo<GeoBounds | null>(() => {
    if (!isEdit) return null
    const zone = geozones.find((z) => z.id === id)
    if (!zone) return null
    const pts =
      zone.shape === "polygon" && zone.path && zone.path.length > 0
        ? zone.path
        : [zone.center]
    const b = boundsOf(pts)
    return b ? padBounds(b, zone.shape === "polygon" ? 0.3 : 0.6) : null
  }, [isEdit, id, geozones])

  // Committed circle preview (polygon previews via the plotter's running outline).
  const previewZone = useMemo<Geozone | null>(() => {
    if (shape !== "circle" || circle === null) return null
    return {
      id: "__preview__",
      name: name || "preview",
      shape: "circle",
      center: circle.center,
      radiusM: circle.radiusM,
      path: null,
      address: "",
      groupId: null,
      color,
      visible: true,
      isPOI: false,
      note: "",
      createdAt: "",
    }
  }, [shape, circle, color, name])

  const hasGeometry = shape === "circle" ? circle !== null : points.length >= 3

  const handleSave = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error(t("geozones.toast.nameRequired"))
      return
    }

    let geometry: Pick<GeozoneInput, "shape" | "center" | "radiusM" | "path">
    if (shape === "circle") {
      if (circle === null) {
        toast.error(t("geozones.editor.circleRequired"))
        return
      }
      geometry = {
        shape: "circle",
        center: circle.center,
        radiusM: circle.radiusM,
        path: null,
      }
    } else {
      if (points.length < 3) {
        toast.error(t("geozones.toast.drawPolygonFirst"))
        return
      }
      geometry = {
        shape: "polygon",
        center: centroidOf(points),
        radiusM: null,
        path: points,
      }
    }

    const input: GeozoneInput = {
      name: trimmedName,
      address: address.trim(),
      groupId: groupId === NO_GROUP ? null : groupId,
      color,
      note: note.trim(),
      ...geometry,
    }

    if (isEdit && id) {
      updateGeozone.mutate(
        { id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("geozones.toast.updated"))
            navigate(`/geozones?id=${id}`)
          },
          onError: () => toast.error(t("geozones.toast.updateFailed")),
        }
      )
    } else {
      createGeozone.mutate(input, {
        onSuccess: (created) => {
          toast.success(t("geozones.toast.created"))
          navigate(`/geozones?id=${created.id}`)
        },
        onError: () => toast.error(t("geozones.toast.createFailed")),
      })
    }
  }

  const colorSwatches = [DEFAULT_GEOZONE_COLOR, ...GEOZONE_GROUP_COLORS]

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[640px] flex-col">
      <PageHeader
        title={
          isEdit
            ? t("geozones.editor.editTitle")
            : t("geozones.editor.createTitle")
        }
        description={
          isEdit
            ? t("geozones.editor.editDescription")
            : t("geozones.editor.createDescription")
        }
        actions={
          <Button variant="ghost" onClick={() => navigate("/geozones")}>
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
              {/* Shape toggle */}
              <div className="space-y-2">
                <Label>{t("geozones.editor.shape")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["circle", "polygon"] as const).map((option) => {
                    const Icon = option === "circle" ? CircleIcon : Hexagon
                    const active = shape === option
                    return (
                      <Button
                        key={option}
                        type="button"
                        variant={active ? "default" : "outline"}
                        disabled={isEdit && !active}
                        onClick={() => switchShape(option)}
                      >
                        <Icon className="size-4" />
                        {t(`geozones.shapes.${option}`)}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geozone-name">{t("forms.name")}</Label>
                <Input
                  id="geozone-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("geozones.form.namePlaceholder")}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="geozone-address">{t("forms.address")}</Label>
                <Input
                  id="geozone-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("geozones.form.addressPlaceholder")}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label>{t("geozones.form.color")}</Label>
                <div className="flex flex-wrap gap-2">
                  {colorSwatches.map((swatch) => {
                    const active = swatch === color
                    return (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => setColor(swatch)}
                        aria-label={swatch}
                        className={cn(
                          "grid size-8 place-items-center rounded-lg ring-offset-2 ring-offset-background transition-transform hover:scale-105",
                          active && "ring-2 ring-ring"
                        )}
                        style={{ backgroundColor: swatch }}
                      >
                        {active ? (
                          <span className="grid size-5 place-items-center rounded-full bg-white shadow ring-1 ring-black/10">
                            <Check className="size-3.5 text-neutral-900" />
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              {!isRealApi ? (
                <div className="space-y-2">
                  <Label htmlFor="geozone-group">{t("forms.group")}</Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger id="geozone-group" className="w-full">
                      <SelectValue placeholder={t("geozones.form.noGroup")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_GROUP}>
                        {t("geozones.form.noGroup")}
                      </SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="geozone-note">{t("forms.note")}</Label>
                <Textarea
                  id="geozone-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("geozones.form.notePlaceholder")}
                  rows={2}
                />
              </div>

              {/* Geometry summary */}
              <div className="space-y-2">
                <Label className="gap-1.5">
                  <MapPin className="size-4 text-muted-foreground" />
                  {t("geozones.editor.geometry")}
                </Label>
                <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
                  {shape === "circle" && circle ? (
                    <p className="text-sm tabular-nums">
                      {t("geozones.editor.circleSummary", {
                        lat: circle.center.lat.toFixed(4),
                        lng: circle.center.lng.toFixed(4),
                        meters: Math.round(circle.radiusM),
                      })}
                    </p>
                  ) : shape === "polygon" && points.length > 0 ? (
                    <p className="text-sm tabular-nums">
                      {t("geozones.map.points", { count: points.length })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("geozones.editor.noGeometry")}
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
              onClick={() => navigate("/geozones")}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isPending || !hasGeometry}
            >
              <Check className="size-4" />
              {isEdit
                ? t("geozones.form.saveGeozone")
                : t("geozones.form.createGeozone")}
            </Button>
          </div>
        </div>

        {/* Right: plotting map */}
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border">
          <FleetMap
            bounds={initialBounds}
            className="h-full w-full rounded-none"
            enableRightClickCoords={false}
          >
            {otherZones.map((zone) => (
              <GeozoneOverlay key={zone.id} zone={zone} color={MUTED_COLOR} />
            ))}
            {previewZone ? (
              <GeozoneOverlay zone={previewZone} color={color} selected />
            ) : null}
            <GeozonePlotter
              key={`${shape}-${plotterKey}`}
              mode={shape}
              points={points}
              onAddPoint={addPoint}
              onCircleComplete={handleCircleComplete}
            />
          </FleetMap>

          {/* Plotting toolbar */}
          <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-primary/40 bg-background/95 px-3 py-1.5 shadow-md backdrop-blur">
            <MapPin className="size-3.5 text-primary" />
            <span className="text-xs font-medium">
              {shape === "circle"
                ? t("geozones.map.circleDrawHint")
                : t("geozones.map.drawHint")}
            </span>
            {shape === "circle" && circle ? (
              <>
                <span className="mx-0.5 h-4 w-px bg-border" />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={redrawCircle}
                >
                  <Trash2 className="size-3.5" />
                  {t("geozones.editor.redraw")}
                </Button>
              </>
            ) : null}
            {shape === "polygon" ? (
              <>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("geozones.map.points", { count: points.length })}
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
                  {t("geozones.map.undo")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={points.length === 0}
                  onClick={() => setPoints([])}
                >
                  <Trash2 className="size-3.5" />
                  {t("geozones.map.clear")}
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
