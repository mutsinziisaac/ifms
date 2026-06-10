import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Hexagon, MapPin, Plus, Upload, X } from "lucide-react"

import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"
import { FleetMap } from "@/components/map/FleetMap"
import { GeozoneOverlay } from "@/components/map/GeozoneOverlay"
import {
  DrawingManager,
  type DrawResult,
} from "@/components/map/DrawingManager"
import { VehicleMarker } from "@/components/map/VehicleMarker"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useGeozoneGroups, useGeozones, useLiveVehicles } from "@/data/hooks"
import type { Geozone } from "@/data/types"
import { DEFAULT_GEOZONE_COLOR } from "@/lib/geozone-colors"
import { boundsOf, padBounds } from "@/lib/maps"
import type { GeoBounds } from "@/lib/maps"

import { GeozoneCsvImportDialog } from "./components/GeozoneCsvImportDialog"
import {
  GeozoneFormDialog,
  type GeozoneDraft,
} from "./components/GeozoneFormDialog"
import { GeozoneGroupDialog } from "./components/GeozoneGroupDialog"
import { GeozoneList } from "./components/GeozoneList"
import { ZoneRulesPanel } from "./components/ZoneRulesPanel"

type DrawMode = "polygon" | "circle" | null

/** Collect every coordinate that defines a zone, for fit-to-bounds. */
function pointsForZone(zone: Geozone) {
  if (zone.shape === "polygon" && zone.path && zone.path.length > 0) {
    return zone.path
  }
  return [zone.center]
}

export function GeozonesPage() {
  const geozones = useGeozones().data ?? []
  const groups = useGeozoneGroups().data ?? []
  const liveVehicles = useLiveVehicles()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [showVehicles, setShowVehicles] = useState(false)

  // Deep-link from global search: /geozones?id=... preselects that zone.
  const [searchParams] = useSearchParams()
  const linkedId = searchParams.get("id")
  useEffect(() => {
    if (linkedId) setSelectedId(linkedId)
  }, [linkedId])

  const [drawMode, setDrawMode] = useState<DrawMode>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editZone, setEditZone] = useState<Geozone | undefined>(undefined)
  const [draft, setDraft] = useState<GeozoneDraft | undefined>(undefined)

  const groupColorById = useMemo(
    () => new Map(groups.map((g) => [g.id, g.color])),
    [groups]
  )

  const colorForZone = (zone: Geozone): string =>
    zone.groupId
      ? (groupColorById.get(zone.groupId) ?? DEFAULT_GEOZONE_COLOR)
      : DEFAULT_GEOZONE_COLOR

  const visibleZones = useMemo(
    () => geozones.filter((zone) => !hiddenIds.has(zone.id)),
    [geozones, hiddenIds]
  )

  const selectedZone = useMemo(
    () => geozones.find((zone) => zone.id === selectedId) ?? null,
    [geozones, selectedId]
  )

  // Fit to the selected zone when one is chosen, otherwise to all visible
  // zones. The drawing flow keeps the current view.
  const bounds = useMemo<GeoBounds | null>(() => {
    if (drawMode) return null
    const source = selectedZone ? [selectedZone] : visibleZones
    if (source.length === 0) return null
    const allPoints = source.flatMap(pointsForZone)
    const raw = boundsOf(allPoints)
    return raw ? padBounds(raw, selectedZone ? 0.5 : 0.15) : null
  }, [drawMode, selectedZone, visibleZones])

  const toggleVisible = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openCreateManual = () => {
    setEditZone(undefined)
    setDraft(undefined)
    setDrawMode(null)
    setFormOpen(true)
  }

  const startDraw = (mode: "polygon" | "circle") => {
    setSelectedId(null)
    setEditZone(undefined)
    setDraft(undefined)
    setDrawMode(mode)
  }

  const handleDrawComplete = (result: DrawResult) => {
    setDrawMode(null)
    const nextDraft: GeozoneDraft =
      result.shape === "polygon"
        ? { shape: "polygon", path: result.path }
        : {
            shape: "circle",
            center: result.center,
            radiusM: result.radiusM,
          }
    setEditZone(undefined)
    setDraft(nextDraft)
    setFormOpen(true)
  }

  const handleEdit = (zone: Geozone) => {
    setDraft(undefined)
    setDrawMode(null)
    setEditZone(zone)
    setFormOpen(true)
  }

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditZone(undefined)
      setDraft(undefined)
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[560px] flex-col">
      <PageHeader
        title="Geozones"
        description="Geofenced corridor points of interest and zone event rules."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="size-4" />
              Import CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setGroupOpen(true)
              }}
            >
              <Plus className="size-4" />
              New group
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button">
                  <Plus className="size-4" />
                  Add geozone
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={openCreateManual}>
                  <MapPin className="size-4" />
                  Manual (circle)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => startDraw("circle")}>
                  <MapPin className="size-4" />
                  Draw circle on map
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => startDraw("polygon")}>
                  <Hexagon className="size-4" />
                  Draw polygon on map
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left panel */}
        <div className="flex w-[380px] shrink-0 flex-col rounded-2xl border bg-card">
          <div className="flex items-center gap-2 border-b p-4">
            <MapPin className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Geozones</span>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-3">
              <GeozoneList
                selectedId={selectedId}
                onSelect={setSelectedId}
                hiddenIds={hiddenIds}
                onToggleVisible={toggleVisible}
                onEdit={handleEdit}
              />

              {selectedZone ? (
                <>
                  <Separator />
                  <div className="rounded-xl border bg-muted/20 p-3">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {selectedZone.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {selectedZone.shape} geozone
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Clear selection"
                        onClick={() => setSelectedId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <ZoneRulesPanel geozone={selectedZone} />
                  </div>
                </>
              ) : null}
            </div>
          </ScrollArea>
        </div>

        {/* Right map */}
        <div className="relative min-w-0 flex-1">
          <FleetMap className="h-full" bounds={bounds}>
            {visibleZones.map((zone) => (
              <GeozoneOverlay
                key={zone.id}
                zone={zone}
                color={colorForZone(zone)}
                selected={zone.id === selectedId}
                onClick={(z) => setSelectedId(z.id)}
              />
            ))}

            {showVehicles
              ? liveVehicles.map((vehicle) => (
                  <VehicleMarker key={vehicle.id} vehicle={vehicle} />
                ))
              : null}

            {drawMode ? (
              <DrawingManager mode={drawMode} onComplete={handleDrawComplete} />
            ) : null}
          </FleetMap>

          {/* Vehicle overlay toggle */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg border bg-background/90 px-3 py-1.5 shadow-sm backdrop-blur">
            <Switch
              id="show-vehicles"
              checked={showVehicles}
              onCheckedChange={setShowVehicles}
              size="sm"
            />
            <label
              htmlFor="show-vehicles"
              className="cursor-pointer text-xs font-medium"
            >
              Live vehicles
            </label>
          </div>

          {/* Drawing banner */}
          {drawMode ? (
            <div className="absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-primary/40 bg-background/95 px-3 py-1.5 shadow-md backdrop-blur">
              <span className="text-xs font-medium">
                Draw a {drawMode} on the map
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setDrawMode(null)}
              >
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>
          ) : null}

          {/* No-zones hint overlay */}
          {geozones.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
              <div className="pointer-events-auto rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur">
                <EmptyState
                  icon={MapPin}
                  title="No geozones yet"
                  description="Draw on the map, add one manually, or import from CSV."
                  action={
                    <Button type="button" onClick={openCreateManual}>
                      <Plus className="size-4" />
                      Add geozone
                    </Button>
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <GeozoneCsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <GeozoneGroupDialog open={groupOpen} onOpenChange={setGroupOpen} />
      <GeozoneFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        geozone={editZone}
        draft={draft}
      />
    </div>
  )
}
