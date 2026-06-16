import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAssignVehicleToDriver, useVehicles } from "@/data/hooks"
import type { Driver } from "@/data/types"
import { fullName } from "@/lib/format"

const UNASSIGN_VALUE = "__unassign__"

export function AssignVehicleDialog({
  open,
  onOpenChange,
  driver,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver: Driver
}) {
  const { t } = useTranslation()
  const vehicles = useVehicles().data ?? []
  const assign = useAssignVehicleToDriver()

  const [selected, setSelected] = useState<string>(
    driver.assignedVehicleId ?? UNASSIGN_VALUE
  )

  useEffect(() => {
    if (open) setSelected(driver.assignedVehicleId ?? UNASSIGN_VALUE)
  }, [open, driver.assignedVehicleId])

  // Vehicles that are free to assign: those without a driver, plus the one
  // already assigned to this driver (so it stays selectable).
  const selectableVehicles = useMemo(
    () =>
      vehicles
        .filter((v) => v.driverId === null || v.id === driver.assignedVehicleId)
        .sort((a, b) => a.plate.localeCompare(b.plate)),
    [vehicles, driver.assignedVehicleId]
  )

  const isPending = assign.isPending

  function handleSubmit(): void {
    const vehicleId = selected === UNASSIGN_VALUE ? null : selected
    assign.mutate(
      { driverId: driver.id, vehicleId },
      {
        onSuccess: () => {
          if (vehicleId === null) {
            toast.success(
              t("drivers.toast.unassigned", { name: fullName(driver) })
            )
          } else {
            const plate =
              vehicles.find((v) => v.id === vehicleId)?.plate ??
              t("drivers.toast.fallbackVehicle")
            toast.success(
              t("drivers.toast.assigned", { plate, name: fullName(driver) })
            )
          }
          onOpenChange(false)
        },
        onError: (err: unknown) =>
          toast.error(
            err instanceof Error ? err.message : t("drivers.toast.assignError")
          ),
      }
    )
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("drivers.assign.title")}
      description={t("drivers.assign.description", { name: fullName(driver) })}
      submitLabel={t("drivers.assign.saveAssignment")}
      onSubmit={handleSubmit}
      isPending={isPending}
    >
      <div className="space-y-1.5">
        <Label>{t("drivers.assign.vehicle")}</Label>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("drivers.assign.selectVehicle")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGN_VALUE}>
              {t("common.unassigned")}
            </SelectItem>
            {selectableVehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.plate} · {vehicle.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("drivers.assign.hint")}
        </p>
      </div>
    </FormDialog>
  )
}
