import { useMemo, useState } from "react"
import { Search, Truck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/common/EmptyState"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEntities, useVehicles } from "@/data/hooks"
import { cn } from "@/lib/utils"

export interface VehiclePickerProps {
  /** Currently selected vehicle ids */
  selected: string[]
  onChange: (ids: string[]) => void
  /** Tailwind height for the scroll area (default h-72) */
  heightClass?: string
}

/**
 * Reusable multi-vehicle picker: search + "select all shown" + a checkbox list.
 * Controlled — the parent owns the selected ids.
 */
export function VehiclePicker({
  selected,
  onChange,
  heightClass = "h-72",
}: VehiclePickerProps) {
  const { t } = useTranslation()
  const vehicles = useVehicles().data ?? []
  const entities = useEntities().data ?? []
  const [search, setSearch] = useState("")

  const entityName = useMemo(() => {
    const map = new Map(entities.map((e) => [e.id, e.shortName]))
    return (id: string) => map.get(id) ?? "—"
  }, [entities])

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (q.length === 0) return vehicles
    return vehicles.filter(
      (v) =>
        v.plate.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        entityName(v.entityId).toLowerCase().includes(q)
    )
  }, [vehicles, search, entityName])

  const toggle = (id: string) => {
    const next = new Set(selectedSet)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(Array.from(next))
  }

  const allShownSelected =
    filtered.length > 0 && filtered.every((v) => selectedSet.has(v.id))

  const toggleAllShown = () => {
    const next = new Set(selectedSet)
    if (allShownSelected) filtered.forEach((v) => next.delete(v.id))
    else filtered.forEach((v) => next.add(v.id))
    onChange(Array.from(next))
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.vehiclePicker.searchPlaceholder")}
          className="pl-8"
          autoComplete="off"
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={allShownSelected}
            onCheckedChange={toggleAllShown}
            disabled={filtered.length === 0}
          />
          {t("common.vehiclePicker.selectAll")}
        </label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("common.vehiclePicker.selected", { count: selected.length })}
        </span>
      </div>

      <ScrollArea className={cn(heightClass, "rounded-lg border")}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={t("common.vehiclePicker.empty")}
            className="py-10"
          />
        ) : (
          <ul className="divide-y">
            {filtered.map((vehicle) => {
              const checked = selectedSet.has(vehicle.id)
              return (
                <li key={vehicle.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50",
                      checked && "bg-primary/5"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(vehicle.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium tabular-nums">
                        {vehicle.plate}
                      </span>
                      <p className="truncate text-xs text-muted-foreground">
                        {entityName(vehicle.entityId)} · {vehicle.description}
                      </p>
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
