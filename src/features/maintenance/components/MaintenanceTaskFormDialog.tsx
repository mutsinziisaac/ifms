import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateMaintenanceTask,
  useUpdateMaintenanceTask,
} from "@/data/hooks"
import type { MaintenanceTaskInput } from "@/data/api"
import type {
  MaintenanceConfirmation,
  MaintenanceParamType,
  MaintenanceTask,
} from "@/data/types"
import { cn } from "@/lib/utils"

import { VehicleMultiSelect } from "./VehicleMultiSelect"

interface FormState {
  title: string
  description: string
  paramType: MaintenanceParamType
  intervalKm: string
  intervalDays: string
  lastServiceKm: string
  lastServiceDate: string
  alertBefore: string
  repeat: boolean
  confirmation: MaintenanceConfirmation
  emailNotifications: boolean
  vehicleIds: string[]
}

function initialState(task?: MaintenanceTask): FormState {
  if (!task) {
    return {
      title: "",
      description: "",
      paramType: "mileage",
      intervalKm: "10000",
      intervalDays: "180",
      lastServiceKm: "",
      lastServiceDate: "",
      alertBefore: "500",
      repeat: true,
      confirmation: "manual",
      emailNotifications: true,
      vehicleIds: [],
    }
  }
  return {
    title: task.title,
    description: task.description,
    paramType: task.paramType,
    intervalKm: task.intervalKm != null ? String(task.intervalKm) : "10000",
    intervalDays: task.intervalDays != null ? String(task.intervalDays) : "180",
    lastServiceKm: "",
    lastServiceDate: "",
    alertBefore: String(task.alertBefore),
    repeat: task.repeat,
    confirmation: task.confirmation,
    emailNotifications: task.emailNotifications,
    vehicleIds: task.vehicles.map((s) => s.vehicleId),
  }
}

export function MaintenanceTaskFormDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: MaintenanceTask
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<FormState>(() => initialState(task))
  const create = useCreateMaintenanceTask()
  const update = useUpdateMaintenanceTask()
  const isPending = create.isPending || update.isPending
  const isEdit = task !== undefined

  // Reset the form whenever the dialog is (re)opened for a given task.
  useEffect(() => {
    if (open) setForm(initialState(task))
  }, [open, task])

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  const isMileage = form.paramType === "mileage"
  const intervalRaw = isMileage ? form.intervalKm : form.intervalDays
  const intervalNum = Number(intervalRaw)
  const intervalValid = intervalRaw.trim() !== "" && intervalNum > 0
  const titleValid = form.title.trim().length > 0
  const hasVehicles = form.vehicleIds.length > 0
  const canSubmit = titleValid && intervalValid && hasVehicles

  function handleSubmit() {
    if (!titleValid) {
      toast.error(t("maintenance.toast.titleRequired"))
      return
    }
    if (!intervalValid) {
      toast.error(
        isMileage
          ? t("maintenance.toast.mileageIntervalRequired")
          : t("maintenance.toast.dayIntervalRequired")
      )
      return
    }
    if (!hasVehicles) {
      toast.error(t("maintenance.toast.selectVehicle"))
      return
    }

    const alertBefore = Number(form.alertBefore)
    const input: MaintenanceTaskInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      paramType: form.paramType,
      intervalKm: isMileage ? Math.round(intervalNum) : null,
      intervalDays: isMileage ? null : Math.round(intervalNum),
      repeat: form.repeat,
      confirmation: form.confirmation,
      emailNotifications: form.emailNotifications,
      alertBefore: Number.isFinite(alertBefore) ? Math.max(0, alertBefore) : 0,
      vehicleIds: form.vehicleIds,
      lastServiceKm:
        isMileage && form.lastServiceKm.trim() !== ""
          ? Math.round(Number(form.lastServiceKm))
          : null,
      lastServiceDate:
        !isMileage && form.lastServiceDate.trim() !== ""
          ? form.lastServiceDate
          : null,
    }

    if (isEdit) {
      update.mutate(
        { id: task.id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("maintenance.toast.updated"))
            onOpenChange(false)
          },
          onError: (err) =>
            toast.error(
              err instanceof Error
                ? err.message
                : t("maintenance.toast.saveFailed")
            ),
        }
      )
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.success(t("maintenance.toast.created"))
          onOpenChange(false)
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("maintenance.toast.saveFailed")
          ),
      })
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t("maintenance.form.editTitle")
          : t("maintenance.form.addTitle")
      }
      description={t("maintenance.form.description")}
      submitLabel={
        isEdit
          ? t("maintenance.form.saveChanges")
          : t("maintenance.form.createTask")
      }
      onSubmit={handleSubmit}
      isPending={isPending}
      disabled={!canSubmit}
      widthClass="sm:max-w-2xl"
    >
      <div className="space-y-2">
        <Label htmlFor="mnt-title">{t("maintenance.form.title")}</Label>
        <Input
          id="mnt-title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={t("maintenance.form.titlePlaceholder")}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mnt-description">
          {t("maintenance.form.descriptionLabel")}
        </Label>
        <Textarea
          id="mnt-description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder={t("maintenance.form.descriptionPlaceholder")}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("maintenance.form.triggerBy")}</Label>
        <RadioGroup
          value={form.paramType}
          onValueChange={(v) => set("paramType", v as MaintenanceParamType)}
          className="grid-cols-2"
        >
          {(
            [
              {
                value: "mileage",
                label: t("maintenance.form.mileage"),
                hint: t("maintenance.form.mileageHint"),
              },
              {
                value: "date",
                label: t("maintenance.form.date"),
                hint: t("maintenance.form.dateHint"),
              },
            ] as const
          ).map((opt) => (
            <Label
              key={opt.value}
              htmlFor={`param-${opt.value}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60",
                form.paramType === opt.value && "border-primary bg-primary/5"
              )}
            >
              <RadioGroupItem
                id={`param-${opt.value}`}
                value={opt.value}
                className="mt-0.5"
              />
              <span className="grid gap-0.5">
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {opt.hint}
                </span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {isMileage ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mnt-interval-km">
              {t("maintenance.form.intervalKm")}
            </Label>
            <Input
              id="mnt-interval-km"
              type="number"
              min={1}
              value={form.intervalKm}
              onChange={(e) => set("intervalKm", e.target.value)}
              placeholder="10000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mnt-alert-km">
              {t("maintenance.form.alertBeforeKm")}
            </Label>
            <Input
              id="mnt-alert-km"
              type="number"
              min={0}
              value={form.alertBefore}
              onChange={(e) => set("alertBefore", e.target.value)}
              placeholder="500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mnt-last-km">
              {t("maintenance.form.lastServiceKm")}
            </Label>
            <Input
              id="mnt-last-km"
              type="number"
              min={0}
              value={form.lastServiceKm}
              onChange={(e) => set("lastServiceKm", e.target.value)}
              placeholder={t("maintenance.form.lastServiceKmPlaceholder")}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mnt-interval-days">
              {t("maintenance.form.intervalDays")}
            </Label>
            <Input
              id="mnt-interval-days"
              type="number"
              min={1}
              value={form.intervalDays}
              onChange={(e) => set("intervalDays", e.target.value)}
              placeholder="180"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mnt-alert-days">
              {t("maintenance.form.alertBeforeDays")}
            </Label>
            <Input
              id="mnt-alert-days"
              type="number"
              min={0}
              value={form.alertBefore}
              onChange={(e) => set("alertBefore", e.target.value)}
              placeholder="14"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mnt-last-date">
              {t("maintenance.form.lastServiceDate")}
            </Label>
            <Input
              id="mnt-last-date"
              type="date"
              value={form.lastServiceDate}
              onChange={(e) => set("lastServiceDate", e.target.value)}
            />
          </div>
        </div>
      )}
      <p className="-mt-2 text-xs text-muted-foreground">
        {isMileage
          ? t("maintenance.form.mileageHelp")
          : t("maintenance.form.dateHelp")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mnt-confirmation">
            {t("maintenance.form.confirmation")}
          </Label>
          <Select
            value={form.confirmation}
            onValueChange={(v) =>
              set("confirmation", v as MaintenanceConfirmation)
            }
          >
            <SelectTrigger id="mnt-confirmation" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">
                {t("maintenance.form.manualConfirmation")}
              </SelectItem>
              <SelectItem value="automatic">
                {t("maintenance.form.automaticConfirmation")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="leading-none">
            {t("maintenance.form.options")}
          </Label>
          <div className="flex flex-col gap-2.5 pt-1.5">
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
              <span>{t("maintenance.form.repeatAfterService")}</span>
              <Switch
                checked={form.repeat}
                onCheckedChange={(v) => set("repeat", v)}
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
              <span>{t("maintenance.form.emailNotifications")}</span>
              <Switch
                checked={form.emailNotifications}
                onCheckedChange={(v) => set("emailNotifications", v)}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>
          {t("maintenance.form.vehicles")}{" "}
          <span className="font-normal text-muted-foreground">
            {t("maintenance.form.vehiclesSelected", {
              count: form.vehicleIds.length,
            })}
          </span>
        </Label>
        <VehicleMultiSelect
          value={form.vehicleIds}
          onChange={(next) => set("vehicleIds", next)}
        />
      </div>
    </FormDialog>
  )
}
