import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { defaultServiceCost } from "@/data/api"
import { useLogMaintenanceService } from "@/data/hooks"
import type { MaintenanceTask } from "@/data/types"

// Workshops a service can be logged against (mirrors the seed pool).
const WORKSHOPS = [
  "MoTL Central Workshop, Kality",
  "Mesfin Industrial Garage, Kotebe",
  "Moenco Service Center, Bole",
  "Ries Engineering Workshop, Lebu",
  "Tana Heavy Equipment, Akaki",
  "National Motors Garage, Gerji",
] as const

interface FormState {
  servicedAt: string
  odometerKm: string
  cost: string
  workshop: string
  technician: string
  notes: string
}

function initialState(
  task: MaintenanceTask,
  currentOdometerKm: number | null
): FormState {
  return {
    servicedAt: new Date().toISOString().slice(0, 10),
    odometerKm:
      task.paramType === "mileage" && currentOdometerKm != null
        ? String(Math.round(currentOdometerKm))
        : "",
    cost: String(defaultServiceCost(task)),
    workshop: WORKSHOPS[0],
    technician: "",
    notes: "",
  }
}

export function LogServiceDialog({
  open,
  onOpenChange,
  task,
  vehicleId,
  vehiclePlate,
  currentOdometerKm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: MaintenanceTask
  vehicleId: string
  vehiclePlate: string
  currentOdometerKm: number | null
}) {
  const { t } = useTranslation()
  const isMileage = task.paramType === "mileage"
  const log = useLogMaintenanceService()

  const [form, setForm] = useState<FormState>(() =>
    initialState(task, currentOdometerKm)
  )

  // Reset whenever the dialog (re)opens for a given vehicle.
  useEffect(() => {
    if (open) setForm(initialState(task, currentOdometerKm))
  }, [open, vehicleId, task, currentOdometerKm])

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  const costNum = Number(form.cost)
  const costValid =
    form.cost.trim() !== "" && Number.isFinite(costNum) && costNum >= 0
  const dateValid = form.servicedAt.trim() !== ""
  const canSubmit = costValid && dateValid

  function handleSubmit() {
    if (!dateValid) {
      toast.error(t("maintenance.toast.pickServiceDate"))
      return
    }
    if (!costValid) {
      toast.error(t("maintenance.toast.enterValidCost"))
      return
    }
    log.mutate(
      {
        taskId: task.id,
        vehicleId,
        servicedAt: new Date(`${form.servicedAt}T12:00:00`).toISOString(),
        odometerKm:
          isMileage && form.odometerKm.trim() !== ""
            ? Math.round(Number(form.odometerKm))
            : null,
        cost: Math.round(costNum),
        workshop: form.workshop,
        technician: form.technician.trim() || null,
        notes: form.notes.trim(),
      },
      {
        onSuccess: () => {
          toast.success(
            t("maintenance.toast.serviceLogged", { plate: vehiclePlate })
          )
          onOpenChange(false)
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("maintenance.toast.logServiceFailed")
          ),
      }
    )
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("maintenance.log.title")}
      description={t("maintenance.log.description", {
        task: task.title.toLowerCase(),
        plate: vehiclePlate,
      })}
      submitLabel={t("maintenance.log.title")}
      onSubmit={handleSubmit}
      isPending={log.isPending}
      disabled={!canSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="svc-date">{t("maintenance.log.serviceDate")}</Label>
          <Input
            id="svc-date"
            type="date"
            value={form.servicedAt}
            onChange={(e) => set("servicedAt", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="svc-cost">{t("maintenance.log.cost")}</Label>
          <Input
            id="svc-cost"
            type="number"
            min={0}
            value={form.cost}
            onChange={(e) => set("cost", e.target.value)}
          />
        </div>
      </div>

      {isMileage ? (
        <div className="space-y-2">
          <Label htmlFor="svc-odo">{t("maintenance.log.odometer")}</Label>
          <Input
            id="svc-odo"
            type="number"
            min={0}
            value={form.odometerKm}
            onChange={(e) => set("odometerKm", e.target.value)}
            placeholder={t("maintenance.log.odometerPlaceholder")}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="svc-workshop">{t("maintenance.log.workshop")}</Label>
        <Select value={form.workshop} onValueChange={(v) => set("workshop", v)}>
          <SelectTrigger id="svc-workshop" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WORKSHOPS.map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="svc-tech">
          {t("maintenance.log.technician")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("forms.optional")}
          </span>
        </Label>
        <Input
          id="svc-tech"
          value={form.technician}
          onChange={(e) => set("technician", e.target.value)}
          placeholder={t("maintenance.log.technicianPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="svc-notes">{t("maintenance.log.notes")}</Label>
        <Textarea
          id="svc-notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder={t("maintenance.log.notesPlaceholder")}
          rows={2}
        />
      </div>
    </FormDialog>
  )
}
