import { useEffect, useMemo, useState } from "react"
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
  useDrivers,
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
import { fullName } from "@/lib/format"

// Radix Select forbids an empty string value, so we use sentinels for the
// "unassigned" / "no route" options and translate them back to null on submit.
const NONE = "__none__"

const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  truck: "Truck",
  trailer: "Trailer",
  tanker: "Tanker",
  bus: "Bus",
  container: "Container",
  pickup: "Pickup",
}

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
  const isEdit = vehicle != null

  const entities = useEntities().data ?? []
  const drivers = useDrivers().data ?? []
  const routes = useRoutes().data ?? []

  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()

  const [plate, setPlate] = useState("")
  const [type, setType] = useState<VehicleType>("truck")
  const [description, setDescription] = useState("")
  const [entityId, setEntityId] = useState("")
  const [region, setRegion] = useState<EthiopiaRegion>("Addis Ababa")
  const [gpsProvider, setGpsProvider] = useState<GpsProvider>(GPS_PROVIDERS[0])
  const [driverId, setDriverId] = useState<string>(NONE)
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
      setDriverId(vehicle.driverId ?? NONE)
      setRouteId(vehicle.routeId ?? NONE)
    } else {
      setPlate("")
      setType("truck")
      setDescription("")
      setEntityId(entities[0]?.id ?? "")
      setRegion("Addis Ababa")
      setGpsProvider(GPS_PROVIDERS[0])
      setDriverId(NONE)
      setRouteId(NONE)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle])

  // Driver options: unassigned drivers + the vehicle's current driver (edit).
  const driverOptions = useMemo(
    () =>
      drivers.filter(
        (d) =>
          d.assignedVehicleId === null ||
          (vehicle != null && d.id === vehicle.driverId)
      ),
    [drivers, vehicle]
  )

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
      driverId: driverId === NONE ? null : driverId,
      routeId: routeId === NONE ? null : routeId,
    }

    if (isEdit) {
      updateVehicle.mutate(
        { id: vehicle.id, patch: input },
        {
          onSuccess: () => {
            toast.success(`Vehicle ${input.plate} updated`)
            onOpenChange(false)
          },
          onError: (error) =>
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update vehicle"
            ),
        }
      )
    } else {
      createVehicle.mutate(input, {
        onSuccess: () => {
          toast.success(`Vehicle ${input.plate} added`)
          onOpenChange(false)
        },
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : "Failed to add vehicle"
          ),
      })
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit vehicle" : "Add vehicle"}
      description={
        isEdit
          ? "Update the registration and monitoring details for this vehicle."
          : "Register a new vehicle operated by a monitored entity."
      }
      submitLabel={isEdit ? "Save changes" : "Add vehicle"}
      onSubmit={handleSubmit}
      isPending={isPending}
      disabled={disabled}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicle-plate">Plate number</Label>
          <Input
            id="vehicle-plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="3-45821 ET"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as VehicleType)}>
            <SelectTrigger id="vehicle-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {VEHICLE_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicle-description">Description</Label>
        <Input
          id="vehicle-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Sinotruk Howo A7 dry cargo"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicle-entity">Entity</Label>
          <Select value={entityId} onValueChange={setEntityId}>
            <SelectTrigger id="vehicle-entity" className="w-full">
              <SelectValue placeholder="Select entity" />
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
          <Label htmlFor="vehicle-region">Region</Label>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicle-gps">GPS provider</Label>
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
          <Label htmlFor="vehicle-driver">Driver</Label>
          <Select value={driverId} onValueChange={setDriverId}>
            <SelectTrigger id="vehicle-driver" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unassigned</SelectItem>
              {driverOptions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {fullName(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicle-route">Assigned route</Label>
        <Select value={routeId} onValueChange={setRouteId}>
          <SelectTrigger id="vehicle-route" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No route</SelectItem>
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
