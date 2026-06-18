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
  useCreateAccident,
  useUpdateAccident,
  useVehicles,
} from "@/data/hooks"
import type { AccidentInput } from "@/data/api"
import type {
  AccidentRecord,
  IncidentRootCause,
  IncidentSeverity,
} from "@/data/types"
import { INCIDENT_ROOT_CAUSES, INCIDENT_SEVERITIES } from "@/data/types"

interface IncidentFormState {
  vehicleId: string
  severity: IncidentSeverity
  rootCause: IncidentRootCause
  occurredDate: string
  address: string
  casualties: string
  repairCostEtb: string
  insuranceClaimEtb: string
  policeReportNo: string
  notes: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function blankState(): IncidentFormState {
  return {
    vehicleId: "",
    severity: "minor",
    rootCause: "driver_error",
    occurredDate: todayIso(),
    address: "",
    casualties: "0",
    repairCostEtb: "0",
    insuranceClaimEtb: "0",
    policeReportNo: "",
    notes: "",
  }
}

function fromRecord(record: AccidentRecord): IncidentFormState {
  return {
    vehicleId: record.vehicleId,
    severity: record.severity,
    rootCause: record.rootCause,
    occurredDate: record.occurredAt.slice(0, 10),
    address: record.address,
    casualties: String(record.casualties),
    repairCostEtb: String(record.repairCostEtb),
    insuranceClaimEtb: String(record.insuranceClaimEtb),
    policeReportNo: record.policeReportNo,
    notes: record.notes,
  }
}

export function IncidentFormDialog({
  open,
  onOpenChange,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: AccidentRecord
}) {
  const { t } = useTranslation()
  const vehicles = useVehicles().data ?? []
  const createAccident = useCreateAccident()
  const updateAccident = useUpdateAccident()
  const isEdit = Boolean(record)

  const [form, setForm] = useState<IncidentFormState>(() =>
    record ? fromRecord(record) : blankState()
  )

  useEffect(() => {
    if (!open) return
    setForm(record ? fromRecord(record) : blankState())
  }, [open, record])

  function patch<K extends keyof IncidentFormState>(
    key: K,
    value: IncidentFormState[K]
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isPending = createAccident.isPending || updateAccident.isPending
  const canSubmit = form.vehicleId.length > 0 && form.occurredDate.length > 0

  function buildInput(): AccidentInput {
    return {
      vehicleId: form.vehicleId,
      severity: form.severity,
      rootCause: form.rootCause,
      address: form.address.trim(),
      occurredAt: new Date(`${form.occurredDate}T12:00:00`).toISOString(),
      casualties: Math.max(0, Math.round(Number(form.casualties) || 0)),
      repairCostEtb: Math.max(0, Math.round(Number(form.repairCostEtb) || 0)),
      insuranceClaimEtb: Math.max(
        0,
        Math.round(Number(form.insuranceClaimEtb) || 0)
      ),
      policeReportNo: form.policeReportNo.trim(),
      notes: form.notes.trim(),
    }
  }

  function handleSubmit(): void {
    if (!canSubmit) {
      toast.error(t("incidents.toast.requiredFields"))
      return
    }
    const input = buildInput()
    const plate =
      vehicles.find((v) => v.id === form.vehicleId)?.plate ?? form.vehicleId

    if (isEdit && record) {
      updateAccident.mutate(
        { id: record.id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("incidents.toast.saved"))
            onOpenChange(false)
          },
          onError: (err: unknown) =>
            toast.error(
              err instanceof Error ? err.message : t("incidents.toast.error")
            ),
        }
      )
      return
    }

    createAccident.mutate(input, {
      onSuccess: () => {
        toast.success(t("incidents.toast.added", { plate }))
        onOpenChange(false)
      },
      onError: (err: unknown) =>
        toast.error(
          err instanceof Error ? err.message : t("incidents.toast.error")
        ),
    })
  }

  const sortedVehicles = [...vehicles].sort((a, b) =>
    a.plate.localeCompare(b.plate, undefined, { numeric: true })
  )

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("incidents.form.editTitle") : t("incidents.form.addTitle")}
      description={
        isEdit
          ? t("incidents.form.editDescription")
          : t("incidents.form.addDescription")
      }
      submitLabel={isEdit ? t("incidents.form.save") : t("incidents.form.add")}
      onSubmit={handleSubmit}
      isPending={isPending}
      disabled={!canSubmit}
      widthClass="sm:max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("incidents.form.vehicle")}</Label>
          <Select
            value={form.vehicleId}
            onValueChange={(v) => patch("vehicleId", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("incidents.form.selectVehicle")} />
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
          <Label>{t("incidents.form.severity")}</Label>
          <Select
            value={form.severity}
            onValueChange={(v) => patch("severity", v as IncidentSeverity)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`enums.incidentSeverity.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("incidents.form.rootCause")}</Label>
          <Select
            value={form.rootCause}
            onValueChange={(v) => patch("rootCause", v as IncidentRootCause)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INCIDENT_ROOT_CAUSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`enums.incidentRootCause.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="incident-date">{t("incidents.form.occurredAt")}</Label>
          <Input
            id="incident-date"
            type="date"
            value={form.occurredDate}
            onChange={(e) => patch("occurredDate", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="incident-casualties">
            {t("incidents.form.casualties")}
          </Label>
          <Input
            id="incident-casualties"
            type="number"
            min={0}
            value={form.casualties}
            onChange={(e) => patch("casualties", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="incident-repair">
            {t("incidents.form.repairCost")}
          </Label>
          <Input
            id="incident-repair"
            type="number"
            min={0}
            value={form.repairCostEtb}
            onChange={(e) => patch("repairCostEtb", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="incident-insurance">
            {t("incidents.form.insuranceClaim")}
          </Label>
          <Input
            id="incident-insurance"
            type="number"
            min={0}
            value={form.insuranceClaimEtb}
            onChange={(e) => patch("insuranceClaimEtb", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="incident-report">
            {t("incidents.form.policeReport")}
          </Label>
          <Input
            id="incident-report"
            value={form.policeReportNo}
            onChange={(e) => patch("policeReportNo", e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="incident-address">{t("incidents.form.address")}</Label>
          <Input
            id="incident-address"
            value={form.address}
            onChange={(e) => patch("address", e.target.value)}
            placeholder={t("incidents.form.addressPlaceholder")}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="incident-notes">{t("incidents.form.notes")}</Label>
          <Textarea
            id="incident-notes"
            value={form.notes}
            onChange={(e) => patch("notes", e.target.value)}
            placeholder={t("incidents.form.notesPlaceholder")}
            rows={2}
          />
        </div>
      </div>
    </FormDialog>
  )
}
