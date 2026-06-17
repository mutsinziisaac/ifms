import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft, Pencil, Trash2, Truck } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeleteVehicle, useEntities, useVehicle } from "@/data/hooks"

import { VehicleDriverCard } from "./components/VehicleDriverCard"
import { VehicleEventsCard } from "./components/VehicleEventsCard"
import { VehicleFormDialog } from "./components/VehicleFormDialog"
import { VehicleIdentityHeader } from "./components/VehicleIdentityHeader"
import { VehicleLiveStatusCard } from "./components/VehicleLiveStatusCard"
import { VehicleMapCard } from "./components/VehicleMapCard"
import { VehicleReportExport } from "./components/VehicleReportExport"
import { VehicleTravelHistory } from "./components/VehicleTravelHistory"

export function VehicleDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const vehicleQuery = useVehicle(id)
  const vehicle = vehicleQuery.data
  const entities = useEntities().data ?? []

  const deleteVehicle = useDeleteVehicle()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (vehicleQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div>
        <EmptyState
          icon={Truck}
          title={t("vehicles.detail.notFoundTitle")}
          description={t("vehicles.detail.notFoundDescription")}
          action={
            <Button asChild variant="outline">
              <Link to="/fleet">
                <ChevronLeft className="size-4" />
                {t("vehicles.detail.backToFleet")}
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  const entity = entities.find((e) => e.id === vehicle.entityId)

  const handleDelete = () => {
    deleteVehicle.mutate(vehicle.id, {
      onSuccess: () => {
        toast.success(t("vehicles.toast.deleted", { plate: vehicle.plate }))
        navigate("/fleet")
      },
      onError: (error) =>
        toast.error(
          error instanceof Error
            ? error.message
            : t("vehicles.toast.deleteFailed")
        ),
    })
  }

  return (
    <div>
      <div className="space-y-5">
        <VehicleIdentityHeader
          vehicle={vehicle}
          entity={entity}
          actions={
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                {t("common.edit")}
              </Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                {t("common.delete")}
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <VehicleMapCard vehicle={vehicle} />
          <VehicleDriverCard vehicle={vehicle} />
        </div>

        <VehicleLiveStatusCard vehicle={vehicle} />

        <VehicleTravelHistory vehicleId={vehicle.id} />

        <VehicleEventsCard vehicleId={vehicle.id} />

        <VehicleReportExport vehicle={vehicle} />
      </div>

      <VehicleFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        vehicle={vehicle}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("vehicles.detail.deleteTitle")}
        description={t("vehicles.detail.deleteDescription", {
          plate: vehicle.plate,
        })}
        confirmLabel={t("vehicles.detail.deleteConfirm")}
        destructive
        onConfirm={handleDelete}
        isPending={deleteVehicle.isPending}
      />
    </div>
  )
}
