import { useEffect, useState } from "react"
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
import { useCreateDriver, useEntities, useUpdateDriver } from "@/data/hooks"
import type { DriverInput } from "@/data/api"
import type { Driver, DriverStatus, LicenseCategory } from "@/data/types"
import { DRIVER_STATUSES, LICENSE_CATEGORIES } from "@/data/types"
import { DRIVER_STATUS_CONFIG } from "@/lib/status"

interface DriverFormState {
  firstName: string
  lastName: string
  licenseNo: string
  licenseCategory: LicenseCategory
  licenseExpiry: string
  phone: string
  email: string
  entityId: string
  status: DriverStatus
  hireDate: string
  emergencyContactName: string
  emergencyContactPhone: string
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function blankState(defaultEntityId: string): DriverFormState {
  return {
    firstName: "",
    lastName: "",
    licenseNo: "",
    licenseCategory: "C",
    licenseExpiry: "",
    phone: "",
    email: "",
    entityId: defaultEntityId,
    status: "active",
    hireDate: todayIso(),
    emergencyContactName: "",
    emergencyContactPhone: "",
  }
}

function fromDriver(driver: Driver): DriverFormState {
  return {
    firstName: driver.firstName,
    lastName: driver.lastName,
    licenseNo: driver.licenseNo,
    licenseCategory: driver.licenseCategory,
    licenseExpiry: driver.licenseExpiry.slice(0, 10),
    phone: driver.phone,
    email: driver.email,
    entityId: driver.entityId,
    status: driver.status,
    hireDate: driver.hireDate.slice(0, 10),
    emergencyContactName: driver.emergencyContactName,
    emergencyContactPhone: driver.emergencyContactPhone,
  }
}

export function DriverFormDialog({
  open,
  onOpenChange,
  driver,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver?: Driver
}) {
  const entities = useEntities().data ?? []
  const createDriver = useCreateDriver()
  const updateDriver = useUpdateDriver()
  const isEdit = Boolean(driver)
  const firstEntityId = entities[0]?.id ?? ""

  const [form, setForm] = useState<DriverFormState>(() =>
    driver ? fromDriver(driver) : blankState("")
  )

  // Reset the form each time the dialog opens (or the target driver changes).
  // Depend on primitives only so editing fields doesn't re-trigger the reset.
  useEffect(() => {
    if (!open) return
    if (driver) {
      setForm(fromDriver(driver))
    } else {
      setForm(blankState(firstEntityId))
    }
  }, [open, driver, firstEntityId])

  function patch<K extends keyof DriverFormState>(
    key: K,
    value: DriverFormState[K]
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isPending = createDriver.isPending || updateDriver.isPending

  const trimmedFirst = form.firstName.trim()
  const trimmedLast = form.lastName.trim()
  const trimmedLicense = form.licenseNo.trim()
  const canSubmit =
    trimmedFirst.length > 0 &&
    trimmedLast.length > 0 &&
    trimmedLicense.length > 0 &&
    form.entityId.length > 0

  function handleSubmit(): void {
    if (!canSubmit) {
      toast.error("First name, last name and license number are required.")
      return
    }

    if (isEdit && driver) {
      const update: Partial<DriverInput> = {
        firstName: trimmedFirst,
        lastName: trimmedLast,
        licenseNo: trimmedLicense,
        licenseCategory: form.licenseCategory,
        licenseExpiry: form.licenseExpiry,
        phone: form.phone.trim(),
        email: form.email.trim(),
        entityId: form.entityId,
        status: form.status,
        hireDate: form.hireDate,
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
      }
      updateDriver.mutate(
        { id: driver.id, patch: update },
        {
          onSuccess: () => {
            toast.success(`Saved ${trimmedFirst} ${trimmedLast}.`)
            onOpenChange(false)
          },
          onError: (err: unknown) =>
            toast.error(
              err instanceof Error ? err.message : "Could not save driver."
            ),
        }
      )
      return
    }

    const input: DriverInput = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      licenseNo: trimmedLicense,
      licenseCategory: form.licenseCategory,
      licenseExpiry: form.licenseExpiry,
      phone: form.phone.trim(),
      email: form.email.trim(),
      entityId: form.entityId,
      status: form.status,
      assignedVehicleId: null,
      hireDate: form.hireDate,
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
    }
    createDriver.mutate(input, {
      onSuccess: () => {
        toast.success(`Added ${trimmedFirst} ${trimmedLast}.`)
        onOpenChange(false)
      },
      onError: (err: unknown) =>
        toast.error(
          err instanceof Error ? err.message : "Could not add driver."
        ),
    })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit driver" : "Add driver"}
      description={
        isEdit
          ? "Update this driver's profile and license details."
          : "Register a new driver. Vehicle assignment is handled separately."
      }
      submitLabel={isEdit ? "Save changes" : "Add driver"}
      onSubmit={handleSubmit}
      isPending={isPending}
      disabled={!canSubmit}
      widthClass="sm:max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="driver-first">First name</Label>
          <Input
            id="driver-first"
            value={form.firstName}
            onChange={(e) => patch("firstName", e.target.value)}
            placeholder="Abebe"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="driver-last">Last name</Label>
          <Input
            id="driver-last"
            value={form.lastName}
            onChange={(e) => patch("lastName", e.target.value)}
            placeholder="Bekele"
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="driver-license-no">License number</Label>
          <Input
            id="driver-license-no"
            value={form.licenseNo}
            onChange={(e) => patch("licenseNo", e.target.value)}
            placeholder="ET-DL-002914"
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.licenseCategory}
              onValueChange={(v) =>
                patch("licenseCategory", v as LicenseCategory)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LICENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="driver-license-expiry">Expiry</Label>
            <Input
              id="driver-license-expiry"
              type="date"
              value={form.licenseExpiry}
              onChange={(e) => patch("licenseExpiry", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="driver-phone">Phone</Label>
          <Input
            id="driver-phone"
            value={form.phone}
            onChange={(e) => patch("phone", e.target.value)}
            placeholder="+251 91 234 5678"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="driver-email">Email</Label>
          <Input
            id="driver-email"
            type="email"
            value={form.email}
            onChange={(e) => patch("email", e.target.value)}
            placeholder="abebe@example.com"
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Entity</Label>
          <Select
            value={form.entityId}
            onValueChange={(v) => patch("entityId", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select entity" />
            </SelectTrigger>
            <SelectContent>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => patch("status", v as DriverStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRIVER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {DRIVER_STATUS_CONFIG[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="driver-hire-date">Hire date</Label>
          <Input
            id="driver-hire-date"
            type="date"
            value={form.hireDate}
            onChange={(e) => patch("hireDate", e.target.value)}
          />
        </div>
        <div className="hidden sm:block" />

        <div className="space-y-1.5">
          <Label htmlFor="driver-ec-name">Emergency contact</Label>
          <Input
            id="driver-ec-name"
            value={form.emergencyContactName}
            onChange={(e) => patch("emergencyContactName", e.target.value)}
            placeholder="Contact name"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="driver-ec-phone">Emergency phone</Label>
          <Input
            id="driver-ec-phone"
            value={form.emergencyContactPhone}
            onChange={(e) => patch("emergencyContactPhone", e.target.value)}
            placeholder="+251 91 765 4321"
            autoComplete="off"
          />
        </div>
      </div>
    </FormDialog>
  )
}
