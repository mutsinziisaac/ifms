import { useEffect, useState } from "react"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useCreateRoute, useUpdateRoute } from "@/data/hooks"
import type { RouteDef } from "@/data/types"

export interface RouteFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route?: RouteDef
}

interface WaypointRow {
  id: string
  name: string
  lat: string
  lng: string
}

// Stable per-row id so React keeps each controlled input bound to its row when
// rows are added/removed from the middle of the list.
let rowSeq = 0
function nextRowId(): string {
  rowSeq += 1
  return `wp-${rowSeq}`
}

function emptyRow(): WaypointRow {
  return { id: nextRowId(), name: "", lat: "", lng: "" }
}

function initialRows(route?: RouteDef): WaypointRow[] {
  if (route && route.waypoints.length > 0) {
    return route.waypoints.map((w) => ({
      id: nextRowId(),
      name: w.name,
      lat: String(w.position.lat),
      lng: String(w.position.lng),
    }))
  }
  return [emptyRow(), emptyRow()]
}

export function RouteFormDialog({
  open,
  onOpenChange,
  route,
}: RouteFormDialogProps) {
  const isEdit = route !== undefined

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [active, setActive] = useState(true)
  const [rows, setRows] = useState<WaypointRow[]>(() => initialRows(route))

  // Reseed the form whenever the dialog opens (or the target route changes).
  useEffect(() => {
    if (!open) return
    setName(route?.name ?? "")
    setDescription(route?.description ?? "")
    setActive(route?.active ?? true)
    setRows(initialRows(route))
  }, [open, route])

  const createRoute = useCreateRoute()
  const updateRoute = useUpdateRoute()
  const isPending = createRoute.isPending || updateRoute.isPending

  const updateRow = (index: number, patch: Partial<WaypointRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    )
  }

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()])
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      toast.error("Route name is required")
      return
    }

    const parsed: { name: string; position: { lat: number; lng: number } }[] =
      []
    for (const row of rows) {
      const wpName = row.name.trim()
      const lat = Number(row.lat)
      const lng = Number(row.lng)
      if (wpName.length === 0) {
        toast.error("Each waypoint needs a name")
        return
      }
      if (
        row.lat.trim() === "" ||
        row.lng.trim() === "" ||
        Number.isNaN(lat) ||
        Number.isNaN(lng)
      ) {
        toast.error(`Waypoint "${wpName}" has invalid coordinates`)
        return
      }
      parsed.push({ name: wpName, position: { lat, lng } })
    }

    if (parsed.length < 2) {
      toast.error("A route needs at least 2 waypoints")
      return
    }

    const input = {
      name: trimmedName,
      description: description.trim(),
      waypoints: parsed,
      active,
    }

    if (isEdit && route) {
      updateRoute.mutate(
        { id: route.id, patch: input },
        {
          onSuccess: () => {
            toast.success(`Route "${trimmedName}" updated`)
            onOpenChange(false)
          },
          onError: (error: Error) => toast.error(error.message),
        }
      )
    } else {
      createRoute.mutate(input, {
        onSuccess: () => {
          toast.success(`Route "${trimmedName}" created`)
          onOpenChange(false)
        },
        onError: (error: Error) => toast.error(error.message),
      })
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit route" : "Add route"}
      description={
        isEdit
          ? "Update the corridor itinerary and its waypoints."
          : "Define a freight corridor as an ordered list of waypoints."
      }
      submitLabel={isEdit ? "Save changes" : "Create route"}
      onSubmit={handleSubmit}
      isPending={isPending}
      widthClass="sm:max-w-xl"
    >
      <div className="space-y-2">
        <Label htmlFor="route-name">Name</Label>
        <Input
          id="route-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Addis Ababa – Djibouti Mainline"
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="route-description">Description</Label>
        <Textarea
          id="route-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Primary freight corridor serving the port of Djibouti."
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="route-active" className="cursor-pointer">
            Active
          </Label>
          <p className="text-xs text-muted-foreground">
            Inactive routes stay on existing assignments but cannot take new
            vehicles.
          </p>
        </div>
        <Switch
          id="route-active"
          checked={active}
          onCheckedChange={setActive}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="gap-1.5">
            <MapPin className="size-4 text-muted-foreground" />
            Waypoints
          </Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {rows.length} stops
          </span>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="flex items-start gap-2 rounded-lg border bg-card p-2.5"
            >
              <span className="mt-2 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary tabular-nums">
                {index + 1}
              </span>
              <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                <Input
                  aria-label={`Waypoint ${index + 1} name`}
                  value={row.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  placeholder="Stop name"
                  autoComplete="off"
                />
                <Input
                  aria-label={`Waypoint ${index + 1} latitude`}
                  value={row.lat}
                  onChange={(e) => updateRow(index, { lat: e.target.value })}
                  placeholder="Lat"
                  inputMode="decimal"
                  className="font-mono text-xs tabular-nums sm:w-28"
                />
                <Input
                  aria-label={`Waypoint ${index + 1} longitude`}
                  value={row.lng}
                  onChange={(e) => updateRow(index, { lng: e.target.value })}
                  placeholder="Lng"
                  inputMode="decimal"
                  className="font-mono text-xs tabular-nums sm:w-28"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(index)}
                disabled={rows.length <= 2}
                aria-label={`Remove waypoint ${index + 1}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={addRow}
        >
          <Plus className="size-4" />
          Add waypoint
        </Button>
      </div>
    </FormDialog>
  )
}
