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
import {
  useCreateFine,
  useDrivers,
  useUpdateFine,
  useVehicles,
} from "@/data/hooks"
import type { FineInput } from "@/data/api"
import type { Fine, FineStatus, ViolationType } from "@/data/types"
import { FINE_STATUSES, VIOLATION_TYPES } from "@/data/types"
import { fullName } from "@/lib/format"

interface FineFormState {
  vehicleId: string
  driverId: string
  violationType: ViolationType
  amountEtb: string
  issuedDate: string
  address: string
  status: FineStatus
  notes: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function blankState(): FineFormState {
  return {
    vehicleId: "",
    driverId: "",
    violationType: "speeding",
    amountEtb: "1000",
    issuedDate: todayIso(),
    address: "",
    status: "pending",
    notes: "",
  }
}

function fromFine(fine: Fine): FineFormState {
  return {
    vehicleId: fine.vehicleId,
    driverId: fine.driverId ?? "",
    violationType: fine.violationType,
    amountEtb: String(fine.amountEtb),
    issuedDate: fine.issuedAt.slice(0, 10),
    address: fine.address,
    status: fine.status,
    notes: fine.notes,
  }
}

export function FineFormDialog({
  open,
  onOpenChange,
  fine,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fine?: Fine
}) {
  const { t } = useTranslation()
  const vehicles = useVehicles().data ?? []
  const drivers = useDrivers().data ?? []
  const createFine = useCreateFine()
  const updateFine = useUpdateFine()
  const isEdit = Boolean(fine)

  const [form, setForm] = useState<FineFormState>(() =>
    fine ? fromFine(fine) : blankState()
  )

  useEffect(() => {
    if (!open) return
    setForm(fine ? fromFine(fine) : blankState())
  }, [open, fine])

  function patch<K extends keyof FineFormState>(
    key: K,
    value: FineFormState[K]
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function onVehicleChange(vehicleId: string): void {
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    setForm((prev) => ({
      ...prev,
      vehicleId,
      driverId: prev.driverId || (vehicle?.driverId ?? ""),
    }))
  }

  const isPending = createFine.isPending || updateFine.isPending
  const canSubmit = form.vehicleId.length > 0 && form.issuedDate.length > 0

  function handleSubmit(): void {
    if (!canSubmit) {
      toast.error(t("fines.toast.requiredFields"))
      return
    }
    const input: FineInput = {
      vehicleId: form.vehicleId,
      driverId: form.driverId || null,
      violationType: form.violationType,
      amountEtb: Math.max(0, Math.round(Number(form.amountEtb) || 0)),
      issuedAt: new Date(`${form.issuedDate}T12:00:00`).toISOString(),
      address: form.address.trim(),
      status: form.status,
      eventId: fine?.eventId ?? null,
      notes: form.notes.trim(),
    }
    const plate =
      vehicles.find((v) => v.id === form.vehicleId)?.plate ?? form.vehicleId

    if (isEdit && fine) {
      updateFine.mutate(
        { id: fine.id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("fines.toast.saved"))
            onOpenChange(false)
          },
          onError: (err: unknown) =>
            toast.error(
              err instanceof Error ? err.message : t("fines.toast.error")
            ),
        }
      )
      return
    }

    createFine.mutate(input, {
      onSuccess: () => {
        toast.success(t("fines.toast.added", { plate }))
        onOpenChange(false)
      },
      onError: (err: unknown) =>
        toast.error(err instanceof Error ? err.message : t("fines.toast.error")),
    })
  }

  const sortedVehicles = [...vehicles].sort((a, b) =>
    a.plate.localeCompare(b.plate, undefined, { numeric: true })
  )
  const sortedDrivers = [...drivers].sort((a, b) =>
    fullName(a).localeCompare(fullName(b))
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("fines.form.editTitle") : t("fines.form.addTitle")}
      description={
        isEdit ? t("fines.form.editDescription") : t("fines.form.addDescription")
      }
      submitLabel={isEdit ? t("fines.form.save") : t("fines.form.add")}
      onSubmit={handleSubmit}
      isPending={isPending}
      disabled={!canSubmit}
      widthClass="sm:max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("fines.form.vehicle")}</Label>
          <Select value={form.vehicleId} onValueChange={onVehicleChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("fines.form.selectVehicle")} />
            </SelectTrigger>
            <SelectContent>
              {sortedVehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("fines.form.driver")}</Label>
          <Select
            value={form.driverId || "none"}
            onValueChange={(v) => patch("driverId", v === "none" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("fines.form.noDriver")}</SelectItem>
              {sortedDrivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {fullName(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("fines.form.type")}</Label>
          <Select
            value={form.violationType}
            onValueChange={(v) => patch("violationType", v as ViolationType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIOLATION_TYPES.map((vt) => (
                <SelectItem key={vt} value={vt}>
                  {t(`enums.violationType.${vt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("fines.form.status")}</Label>
          <Select
            value={form.status}
            onValueChange={(v) => patch("status", v as FineStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`enums.fineStatus.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fine-amount">{t("fines.form.amount")}</Label>
          <Input
            id="fine-amount"
            type="number"
            min={0}
            value={form.amountEtb}
            onChange={(e) => patch("amountEtb", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fine-date">{t("fines.form.issuedAt")}</Label>
          <Input
            id="fine-date"
            type="date"
            value={form.issuedDate}
            onChange={(e) => patch("issuedDate", e.target.value)}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="fine-address">{t("fines.form.address")}</Label>
          <Input
            id="fine-address"
            value={form.address}
            onChange={(e) => patch("address", e.target.value)}
            placeholder={t("fines.form.addressPlaceholder")}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="fine-notes">{t("fines.form.notes")}</Label>
          <Textarea
            id="fine-notes"
            value={form.notes}
            onChange={(e) => patch("notes", e.target.value)}
            placeholder={t("fines.form.notesPlaceholder")}
            rows={2}
          />
        </div>
      </div>
    </FormDialog>
  )
}
