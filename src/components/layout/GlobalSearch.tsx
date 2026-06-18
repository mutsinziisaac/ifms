import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Hexagon, Route, Search, Truck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useGeozones, useRoutes, useVehicles } from "@/data/hooks"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"

const MAX_PER_GROUP = 5

export function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const vehicles = useVehicles().data ?? []
  const geozones = useGeozones().data ?? []
  const routes = useRoutes().data ?? []

  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const term = query.trim().toLowerCase()
  const enough = term.length >= 3

  const go = (path: string) => {
    setOpen(false)
    setQuery("")
    navigate(path)
  }

  const vehicleMatches = enough
    ? vehicles
        .filter(
          (v) =>
            v.plate.toLowerCase().includes(term) ||
            v.description.toLowerCase().includes(term)
        )
        .slice(0, MAX_PER_GROUP)
    : []

  const geozoneMatches = enough
    ? geozones
        .filter((g) => g.name.toLowerCase().includes(term))
        .slice(0, MAX_PER_GROUP)
    : []

  const routeMatches = enough
    ? routes
        .filter((r) => r.name.toLowerCase().includes(term))
        .slice(0, MAX_PER_GROUP)
    : []

  return (
    <>
      <Button
        variant="outline"
        className="h-9 w-64 justify-start gap-2 px-3 text-sm font-normal text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        {t("common.search.trigger")}
        <Kbd className="ml-auto">⌘K</Kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("common.search.placeholder")}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!enough ? (
              <CommandEmpty>{t("common.search.minChars")}</CommandEmpty>
            ) : (
              <>
                {vehicleMatches.length > 0 ? (
                  <CommandGroup heading={t("common.search.groups.vehicles")}>
                    {vehicleMatches.map((v) => (
                      <CommandItem
                        key={v.id}
                        value={`vehicle-${v.id}`}
                        onSelect={() => go(`/fleet/${v.id}`)}
                      >
                        <Truck />
                        <span className="font-medium">{v.plate}</span>
                        <span className="truncate text-muted-foreground">
                          {v.description}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {geozoneMatches.length > 0 ? (
                  <CommandGroup heading={t("common.search.groups.geozones")}>
                    {geozoneMatches.map((g) => (
                      <CommandItem
                        key={g.id}
                        value={`geozone-${g.id}`}
                        onSelect={() => go(`/geozones?id=${g.id}`)}
                      >
                        <Hexagon />
                        <span>{g.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {routeMatches.length > 0 ? (
                  <CommandGroup heading={t("common.search.groups.routes")}>
                    {routeMatches.map((r) => (
                      <CommandItem
                        key={r.id}
                        value={`route-${r.id}`}
                        onSelect={() => go(`/routes?id=${r.id}`)}
                      >
                        <Route />
                        <span>{r.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}

                {vehicleMatches.length === 0 &&
                geozoneMatches.length === 0 &&
                routeMatches.length === 0 ? (
                  <CommandEmpty>{t("common.search.noResults")}</CommandEmpty>
                ) : null}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
