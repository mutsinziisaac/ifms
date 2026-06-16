import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface SelectionOption {
  value: string
  label: string
  sub?: string
}

/**
 * Generic multi-select panel for the report base (vehicles or drivers).
 * An empty selection means "all records" — surfaced in the hint line.
 */
export function ReportSelectionPanel({
  options,
  value,
  onChange,
  searchPlaceholder,
}: {
  options: SelectionOption[]
  value: string[]
  onChange: (next: string[]) => void
  searchPlaceholder: string
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const selected = useMemo(() => new Set(value), [value])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sub ?? "").toLowerCase().includes(q)
    )
  }, [options, search])

  const allShownSelected =
    filtered.length > 0 && filtered.every((o) => selected.has(o.value))

  function toggle(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  function toggleAllShown() {
    const next = new Set(selected)
    if (allShownSelected) {
      for (const o of filtered) next.delete(o.value)
    } else {
      for (const o of filtered) next.add(o.value)
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
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
          <Checkbox
            checked={allShownSelected}
            onCheckedChange={toggleAllShown}
            disabled={filtered.length === 0}
          />
          <span className="whitespace-nowrap">
            {t("reports.selection.selectAll")}
          </span>
        </label>
      </div>

      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
        <span>
          {value.length === 0
            ? t("reports.selection.hintAll")
            : t("reports.selection.countShown", { count: filtered.length })}
        </span>
        <span className="font-medium text-foreground tabular-nums">
          {t("reports.selection.selectedCount", { count: value.length })}
        </span>
      </div>

      <ScrollArea className="h-56">
        <div className="px-1.5 pb-1.5">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {t("reports.selection.noMatch", { query: search })}
            </div>
          ) : (
            filtered.map((o) => {
              const checked = selected.has(o.value)
              return (
                <label
                  key={o.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted",
                    checked && "bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(o.value)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tabular-nums">
                      {o.label}
                    </p>
                    {o.sub != null && (
                      <p className="truncate text-xs text-muted-foreground">
                        {o.sub}
                      </p>
                    )}
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
