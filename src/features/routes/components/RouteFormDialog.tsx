import { useEffect, useState } from "react"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
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
      toast.error(t("routes.toast.nameRequired"))
      return
    }

    const parsed: { name: string; position: { lat: number; lng: number } }[] =
      []
    for (const row of rows) {
      const wpName = row.name.trim()
      const lat = Number(row.lat)
      const lng = Number(row.lng)
      if (wpName.length === 0) {
        toast.error(t("routes.toast.waypointNameRequired"))
        return
      }
      if (
        row.lat.trim() === "" ||
        row.lng.trim() === "" ||
        Number.isNaN(lat) ||
        Number.isNaN(lng)
      ) {
        toast.error(t("routes.toast.waypointInvalidCoords", { name: wpName }))
        return
      }
      parsed.push({ name: wpName, position: { lat, lng } })
    }

    if (parsed.length < 2) {
      toast.error(t("routes.toast.minWaypoints"))
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
            toast.success(t("routes.toast.updated", { name: trimmedName }))
            onOpenChange(false)
          },
          onError: (error: Error) => toast.error(error.message),
        }
      )
    } else {
      createRoute.mutate(input, {
        onSuccess: () => {
          toast.success(t("routes.toast.created", { name: trimmedName }))
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
      title={isEdit ? t("routes.form.editTitle") : t("routes.form.addTitle")}
      description={
        isEdit
          ? t("routes.form.editDescription")
          : t("routes.form.addDescription")
      }
      submitLabel={
        isEdit ? t("routes.form.saveChanges") : t("routes.form.createRoute")
      }
      onSubmit={handleSubmit}
      isPending={isPending}
      widthClass="sm:max-w-xl"
    >
      <div className="space-y-2">
        <Label htmlFor="route-name">{t("forms.name")}</Label>
        <Input
          id="route-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("routes.form.namePlaceholder")}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="route-description">{t("forms.description")}</Label>
        <Textarea
          id="route-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("routes.form.descriptionPlaceholder")}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
        <div className="space-y-0.5">
          <Label htmlFor="route-active" className="cursor-pointer">
            {t("routes.active")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("routes.form.activeHint")}
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
            {t("routes.form.waypoints")}
          </Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("routes.form.stops", { count: rows.length })}
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
                  aria-label={t("routes.form.waypointName", {
                    index: index + 1,
                  })}
                  value={row.name}
                  onChange={(e) => updateRow(index, { name: e.target.value })}
                  placeholder={t("routes.form.stopNamePlaceholder")}
                  autoComplete="off"
                />
                <Input
                  aria-label={t("routes.form.waypointLat", {
                    index: index + 1,
                  })}
                  value={row.lat}
                  onChange={(e) => updateRow(index, { lat: e.target.value })}
                  placeholder={t("routes.form.latPlaceholder")}
                  inputMode="decimal"
                  className="font-mono text-xs tabular-nums sm:w-28"
                />
                <Input
                  aria-label={t("routes.form.waypointLng", {
                    index: index + 1,
                  })}
                  value={row.lng}
                  onChange={(e) => updateRow(index, { lng: e.target.value })}
                  placeholder={t("routes.form.lngPlaceholder")}
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
                aria-label={t("routes.form.removeWaypoint", {
                  index: index + 1,
                })}
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
          {t("routes.form.addWaypoint")}
        </Button>
      </div>
    </FormDialog>
  )
}
