import { useMemo, useState } from "react"
import {
  Circle as CircleIcon,
  Eye,
  EyeOff,
  Hexagon,
  MapPin,
  Pencil,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { EmptyState } from "@/components/common/EmptyState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeleteGeozone, useGeozoneGroups, useGeozones } from "@/data/hooks"
import type { Geozone, GeozoneGroup } from "@/data/types"
import { DEFAULT_GEOZONE_COLOR } from "@/lib/geozone-colors"
import { cn } from "@/lib/utils"

export interface GeozoneListProps {
  selectedId: string | null
  onSelect: (id: string) => void
  hiddenIds: Set<string>
  onToggleVisible: (id: string) => void
  onEdit: (zone: Geozone) => void
}

interface GroupBucket {
  group: GeozoneGroup | null
  zones: Geozone[]
}

const UNGROUPED_KEY = "__ungrouped__"

export function GeozoneList({
  selectedId,
  onSelect,
  hiddenIds,
  onToggleVisible,
  onEdit,
}: GeozoneListProps) {
  const geozonesQuery = useGeozones()
  const groups = useGeozoneGroups().data ?? []

  const [search, setSearch] = useState("")
  const [pendingDelete, setPendingDelete] = useState<Geozone | null>(null)
  const deleteGeozone = useDeleteGeozone()

  const zones = geozonesQuery.data ?? []
  const groupById = useMemo(
    () => new Map(groups.map((g) => [g.id, g])),
    [groups]
  )

  const buckets = useMemo<GroupBucket[]>(() => {
    const query = search.trim().toLowerCase()
    const filtered = query
      ? zones.filter(
          (z) =>
            z.name.toLowerCase().includes(query) ||
            z.address.toLowerCase().includes(query)
        )
      : zones

    const byKey = new Map<string, GroupBucket>()
    for (const zone of filtered) {
      const key = zone.groupId ?? UNGROUPED_KEY
      const existing = byKey.get(key)
      if (existing) {
        existing.zones.push(zone)
      } else {
        byKey.set(key, {
          group: zone.groupId ? (groupById.get(zone.groupId) ?? null) : null,
          zones: [zone],
        })
      }
    }

    return Array.from(byKey.values()).sort((a, b) => {
      // Grouped buckets first (alphabetical), ungrouped last.
      if (!a.group) return 1
      if (!b.group) return -1
      return a.group.name.localeCompare(b.group.name)
    })
  }, [zones, search, groupById])

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteGeozone.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success("Geozone deleted")
        setPendingDelete(null)
      },
      onError: () => toast.error("Could not delete geozone"),
    })
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search geozones…"
          className="pl-9"
        />
      </div>

      {geozonesQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : buckets.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No geozones"
          description={
            search
              ? "No geozones match your search."
              : "Add a geozone to start monitoring corridor points of interest."
          }
        />
      ) : (
        <div className="space-y-4">
          {buckets.map((bucket) => {
            const color = bucket.group?.color ?? DEFAULT_GEOZONE_COLOR
            return (
              <div
                key={bucket.group?.id ?? UNGROUPED_KEY}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2 px-1">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {bucket.group?.name ?? "Ungrouped"}
                  </span>
                  <span className="text-xs text-muted-foreground/70 tabular-nums">
                    {bucket.zones.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {bucket.zones.map((zone) => {
                    const hidden = hiddenIds.has(zone.id)
                    const selected = zone.id === selectedId
                    const ShapeIcon =
                      zone.shape === "circle" ? CircleIcon : Hexagon
                    return (
                      <div
                        key={zone.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelect(zone.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            onSelect(zone.id)
                          }
                        }}
                        className={cn(
                          "group flex cursor-pointer items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-ring/40 hover:bg-accent/40",
                          selected &&
                            "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                        )}
                      >
                        <ShapeIcon
                          className="size-4 shrink-0"
                          style={{ color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "truncate text-sm font-medium",
                                hidden && "text-muted-foreground"
                              )}
                            >
                              {zone.name}
                            </span>
                            {zone.isPOI ? (
                              <Badge
                                variant="outline"
                                className="h-4 border-secondary/40 px-1.5 text-[10px] text-secondary-foreground"
                              >
                                POI
                              </Badge>
                            ) : null}
                          </div>
                          {zone.address ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {zone.address}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={hidden ? "Show on map" : "Hide on map"}
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleVisible(zone.id)
                            }}
                          >
                            {hidden ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit geozone"
                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(zone)
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete geozone"
                            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPendingDelete(zone)
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Delete geozone?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" and its alert rules will be permanently removed.`
            : ""
        }
        confirmLabel="Delete geozone"
        destructive
        onConfirm={confirmDelete}
        isPending={deleteGeozone.isPending}
      />
    </div>
  )
}
