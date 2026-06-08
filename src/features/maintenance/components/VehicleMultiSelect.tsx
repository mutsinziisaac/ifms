import { useMemo, useState } from "react"
import { Search, Truck } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useEntities, useVehicles } from "@/data/hooks"
import { cn } from "@/lib/utils"

export function VehicleMultiSelect({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [search, setSearch] = useState("")
  const { data: vehicles, isLoading } = useVehicles()
  const { data: entities } = useEntities()

  const entityName = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of entities ?? []) map.set(e.id, e.shortName)
    return map
  }, [entities])

  const selected = useMemo(() => new Set(value), [value])

  const sorted = useMemo(
    () =>
      [...(vehicles ?? [])].sort((a, b) =>
        a.plate.localeCompare(b.plate, undefined, { numeric: true })
      ),
    [vehicles]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((v) => {
      const entity = entityName.get(v.entityId) ?? ""
      return (
        v.plate.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        entity.toLowerCase().includes(q)
      )
    })
  }, [sorted, search, entityName])

  const allShownSelected =
    filtered.length > 0 && filtered.every((v) => selected.has(v.id))

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  function toggleAllShown() {
    const next = new Set(selected)
    if (allShownSelected) {
      for (const v of filtered) next.delete(v.id)
    } else {
      for (const v of filtered) next.add(v.id)
    }
    onChange([...next])
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b p-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by plate, entity, or type…"
            className="pl-8"
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
          <Checkbox
            checked={allShownSelected}
            onCheckedChange={toggleAllShown}
            disabled={filtered.length === 0}
          />
          <span className="whitespace-nowrap">Select all</span>
        </label>
      </div>

      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
        <span>
          {filtered.length} vehicle{filtered.length === 1 ? "" : "s"}
          {search.trim() ? " shown" : ""}
        </span>
        <span className="font-medium text-foreground tabular-nums">
          {value.length} selected
        </span>
      </div>

      <ScrollArea className="h-64">
        <div className="px-1.5 pb-1.5">
          {isLoading ? (
            <div className="space-y-1.5 p-1.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No vehicles match “{search}”.
            </div>
          ) : (
            filtered.map((v) => {
              const checked = selected.has(v.id)
              return (
                <label
                  key={v.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted",
                    checked && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(v.id)}
                  />
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                    <Truck className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tabular-nums">
                      {v.plate}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entityName.get(v.entityId) ?? "—"} · {v.type}
                    </p>
                  </div>
                </label>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
