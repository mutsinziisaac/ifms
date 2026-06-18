import { useEffect, useMemo, useState } from "react"
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
import {
  useCreateVehicle,
  useEntities,
  useRoutes,
  useUpdateVehicle,
} from "@/data/hooks"
import type {
  EthiopiaRegion,
  GpsProvider,
  Vehicle,
  VehicleType,
} from "@/data/types"
import { ETHIOPIA_REGIONS, GPS_PROVIDERS, VEHICLE_TYPES } from "@/data/types"

// Radix Select forbids an empty string value, so we use sentinels for the
// "unassigned" / "no route" options and translate them back to null on submit.
const NONE = "__none__"

export interface VehicleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: Vehicle
}

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
}: VehicleFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = vehicle != null

  const entities = useEntities().data ?? []
  const routes = useRoutes().data ?? []

  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()

  const [plate, setPlate] = useState("")
  const [type, setType] = useState<VehicleType>("truck")
  const [description, setDescription] = useState("")
  const [entityId, setEntityId] = useState("")
  const [region, setRegion] = useState<EthiopiaRegion>("Addis Ababa")
  const [gpsProvider, setGpsProvider] = useState<GpsProvider>(GPS_PROVIDERS[0])
  const [routeId, setRouteId] = useState<string>(NONE)

  // Seed the form whenever the dialog opens (create -> blank, edit -> vehicle).
  useEffect(() => {
    if (!open) return
    if (vehicle) {
      setPlate(vehicle.plate)
      setType(vehicle.type)
      setDescription(vehicle.description)
      setEntityId(vehicle.entityId)
      setRegion(vehicle.region)
      setGpsProvider(vehicle.gpsProvider)
      setRouteId(vehicle.routeId ?? NONE)
    } else {
      setPlate("")
      setType("truck")
      setDescription("")
      setEntityId(entities[0]?.id ?? "")
      setRegion("Addis Ababa")
      setGpsProvider(GPS_PROVIDERS[0])
      setRouteId(NONE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle])

  // Route options: active routes + the vehicle's current route (edit).
  const routeOptions = useMemo(
    () =>
      routes.filter(
        (r) => r.active || (vehicle != null && r.id === vehicle.routeId)
      ),
    [routes, vehicle]
  )

  const isPending = createVehicle.isPending || updateVehicle.isPending
  const disabled =
    plate.trim() === "" || description.trim() === "" || entityId === ""

  const handleSubmit = () => {
    if (disabled) return
    const input = {
      plate: plate.trim(),
      type,
      description: description.trim(),
      entityId,
      region,
      gpsProvider,
      routeId: routeId === NONE ? null : routeId,
    }

    if (isEdit) {
      updateVehicle.mutate(
        { id: vehicle.id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("vehicles.toast.updated", { plate: input.plate }))
            onOpenChange(false)
          },
          onError: (error) =>
            toast.error(
              error instanceof Error
                ? error.message
                : t("vehicles.toast.updateFailed")
            ),
        }
      )
    } else {
      createVehicle.mutate(input, {
        onSuccess: () => {
          toast.success(t("vehicles.toast.created", { plate: input.plate }))
          onOpenChange(false)
        },
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : t("vehicles.toast.createFailed")
          ),
      })
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit ? t("vehicles.form.editTitle") : t("vehicles.form.addTitle")
      }
      description={
        isEdit
          ? t("vehicles.form.editDescription")
          : t("vehicles.form.addDescription")
      }
      submitLabel={
        isEdit ? t("vehicles.form.saveChanges") : t("vehicles.form.addTitle")
      }
      onSubmit={handleSubmit}
      isPending={isPending}
      disabled={disabled}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicle-plate">
            {t("vehicles.form.plateNumber")}
          </Label>
          <Input
            id="vehicle-plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder={t("vehicles.form.platePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle-type">{t("forms.type")}</Label>
          <Select value={type} onValueChange={(v) => setType(v as VehicleType)}>
            <SelectTrigger id="vehicle-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((vt) => (
                <SelectItem key={vt} value={vt}>
                  {t(`enums.vehicleType.${vt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicle-description">{t("forms.description")}</Label>
        <Input
          id="vehicle-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("vehicles.form.descriptionPlaceholder")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicle-entity">{t("forms.entity")}</Label>
          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger id="vehicle-entity" className="w-full">
              <SelectValue placeholder={t("vehicles.form.selectEntity")} />
            </SelectTrigger>
            <SelectContent>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle-region">{t("forms.region")}</Label>
          <Select
            value={region}
            onValueChange={(v) => setRegion(v as EthiopiaRegion)}
          >
            <SelectTrigger id="vehicle-region" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ETHIOPIA_REGIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicle-gps">{t("forms.gpsProvider")}</Label>
        <Select
          value={gpsProvider}
          onValueChange={(v) => setGpsProvider(v as GpsProvider)}
        >
          <SelectTrigger id="vehicle-gps" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GPS_PROVIDERS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicle-route">
          {t("vehicles.form.assignedRoute")}
        </Label>
        <Select value={routeId} onValueChange={setRouteId}>
          <SelectTrigger id="vehicle-route" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t("vehicles.form.noRoute")}</SelectItem>
            {routeOptions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormDialog>
  )
}
