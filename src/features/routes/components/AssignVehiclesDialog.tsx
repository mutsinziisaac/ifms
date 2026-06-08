import { useEffect, useMemo, useState } from "react"
import { Search, TriangleAlert, Truck } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/common/EmptyState"
import { FormDialog } from "@/components/common/FormDialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useAssignVehiclesToRoute,
  useEntities,
  useVehicles,
} from "@/data/hooks"
import type { RouteDef } from "@/data/types"
import { cn } from "@/lib/utils"

export interface AssignVehiclesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route: RouteDef
}

export function AssignVehiclesDialog({
  open,
  onOpenChange,
  route,
}: AssignVehiclesDialogProps) {
  const vehicles = useVehicles().data ?? []
  const entities = useEntities().data ?? []
  const assign = useAssignVehiclesToRoute()

  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const entityName = useMemo(() => {
    const map = new Map(entities.map((e) => [e.id, e.shortName]))
    return (id: string) => map.get(id) ?? "—"
  }, [entities])

  // Seed the checkbox state from vehicles already on this route each open.
  useEffect(() => {
    if (!open) return
    setSearch("")
    setSelected(
      new Set(vehicles.filter((v) => v.routeId === route.id).map((v) => v.id))
    )
    // Only reseed when the dialog opens or the target route changes; we don't
    // want live vehicle list churn to wipe the operator's in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, route.id])

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
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = () => {
    if (!route.active) {
      toast.error(
        "This route is deactivated and cannot take new vehicle assignments"
      )
      return
    }
    assign.mutate(
      { routeId: route.id, vehicleIds: Array.from(selected) },
      {
        onSuccess: () => {
          toast.success(
            `${selected.size} vehicle${selected.size === 1 ? "" : "s"} assigned to "${route.name}"`
          )
          onOpenChange(false)
        },
        onError: (error: Error) => toast.error(error.message),
      }
    )
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Assign vehicles"
      description={`Select the vehicles that run the "${route.name}" corridor.`}
      submitLabel={`Assign (${selected.size})`}
      onSubmit={handleSubmit}
      isPending={assign.isPending}
      disabled={!route.active}
      widthClass="sm:max-w-lg"
    >
      {!route.active ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>Route deactivated</AlertTitle>
          <AlertDescription>
            Deactivated routes remain effective for vehicles already assigned,
            but cannot be added to new itineraries. Reactivate the route to
            assign vehicles.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by plate, model or entity…"
          className="pl-8"
          autoComplete="off"
        />
      </div>

      <ScrollArea className="h-72 rounded-lg border">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No vehicles found"
            description="Try a different search term."
            className="py-10"
          />
        ) : (
          <ul className="divide-y">
            {filtered.map((vehicle) => {
              const checked = selected.has(vehicle.id)
              const onThisRoute = vehicle.routeId === route.id
              const onOtherRoute =
                vehicle.routeId !== null && vehicle.routeId !== route.id
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
                      disabled={!route.active}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {vehicle.plate}
                        </span>
                        {onThisRoute ? (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            On route
                          </span>
                        ) : onOtherRoute ? (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Other route
                          </span>
                        ) : null}
                      </div>
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
    </FormDialog>
  )
}
