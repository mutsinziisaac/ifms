import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { MapPin, Plus, Upload, X } from "lucide-react"

import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"
import { FleetMap } from "@/components/map/FleetMap"
import { GeozoneOverlay } from "@/components/map/GeozoneOverlay"
import { VehicleMarker } from "@/components/map/VehicleMarker"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { isRealApi } from "@/data/api"
import { useGeozoneGroups, useGeozones, useLiveVehicles } from "@/data/hooks"
import type { Geozone } from "@/data/types"
import { DEFAULT_GEOZONE_COLOR } from "@/lib/geozone-colors"
import { boundsOf, padBounds } from "@/lib/maps"
import type { GeoBounds } from "@/lib/maps"

import { GeozoneCsvImportDialog } from "./components/GeozoneCsvImportDialog"
import { GeozoneGroupDialog } from "./components/GeozoneGroupDialog"
import { GeozoneList } from "./components/GeozoneList"
import { ZoneRulesPanel } from "./components/ZoneRulesPanel"

/** Collect every coordinate that defines a zone, for fit-to-bounds. */
function pointsForZone(zone: Geozone) {
  if (zone.shape === "polygon" && zone.path && zone.path.length > 0) {
    return zone.path
  }
  return [zone.center]
}

export function GeozonesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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

  const [importOpen, setImportOpen] = useState(false)
  const [groupOpen, setGroupOpen] = useState(false)

  const groupColorById = useMemo(
    () => new Map(groups.map((g) => [g.id, g.color])),
    [groups]
  )

  const colorForZone = (zone: Geozone): string =>
    zone.color ??
    (zone.groupId
      ? (groupColorById.get(zone.groupId) ?? DEFAULT_GEOZONE_COLOR)
      : DEFAULT_GEOZONE_COLOR)

  const visibleZones = useMemo(
    () => geozones.filter((zone) => !hiddenIds.has(zone.id)),
    [geozones, hiddenIds]
  )

  const selectedZone = useMemo(
    () => geozones.find((zone) => zone.id === selectedId) ?? null,
    [geozones, selectedId]
  )

  // Fit to the selected zone when one is chosen, otherwise to all visible zones.
  const bounds = useMemo<GeoBounds | null>(() => {
    const source = selectedZone ? [selectedZone] : visibleZones
    if (source.length === 0) return null
    const allPoints = source.flatMap(pointsForZone)
    const raw = boundsOf(allPoints)
    return raw ? padBounds(raw, selectedZone ? 0.5 : 0.15) : null
  }, [selectedZone, visibleZones])

  const toggleVisible = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleEdit = (zone: Geozone) => navigate(`/geozones/${zone.id}/edit`)

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[560px] flex-col">
      <PageHeader
        title={t("geozones.title")}
        description={t("geozones.description")}
        actions={
          <>
            {!isRealApi ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImportOpen(true)}
                >
                  <Upload className="size-4" />
                  {t("geozones.toolbar.importCsv")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGroupOpen(true)}
                >
                  <Plus className="size-4" />
                  {t("geozones.toolbar.newGroup")}
                </Button>
              </>
            ) : null}
            <Button type="button" onClick={() => navigate("/geozones/new")}>
              <Plus className="size-4" />
              {t("geozones.toolbar.addGeozone")}
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Left panel */}
        <div className="flex w-[380px] shrink-0 flex-col rounded-2xl border bg-card">
          <div className="flex items-center gap-2 border-b p-4">
            <MapPin className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t("geozones.list.panelTitle")}
            </span>
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
                        <p className="text-xs text-muted-foreground">
                          {t("geozones.list.shapeGeozone", {
                            shape: t(`geozones.shapes.${selectedZone.shape}`),
                          })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("geozones.toolbar.clearSelection")}
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
              {t("geozones.toolbar.liveVehicles")}
            </label>
          </div>

          {/* No-zones hint overlay */}
          {geozones.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
              <div className="pointer-events-auto rounded-2xl border bg-background/95 p-2 shadow-lg backdrop-blur">
                <EmptyState
                  icon={MapPin}
                  title={t("geozones.map.emptyTitle")}
                  description={t("geozones.map.emptyDescription")}
                  action={
                    <Button
                      type="button"
                      onClick={() => navigate("/geozones/new")}
                    >
                      <Plus className="size-4" />
                      {t("geozones.toolbar.addGeozone")}
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
    </div>
  )
}
