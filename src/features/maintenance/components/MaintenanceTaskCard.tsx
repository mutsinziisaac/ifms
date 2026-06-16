import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Gauge,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { MaintenanceStatusBadge } from "@/components/common/status-badges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useConfirmMaintenanceTask,
  useDeleteMaintenanceTask,
  useVehicles,
} from "@/data/hooks"
import type { MaintenanceTask, Vehicle } from "@/data/types"
import { formatKm } from "@/lib/format"
import { computeMaintenanceState } from "@/lib/status"

import { MaintenanceStatusPie } from "./MaintenanceStatusPie"
import { MaintenanceTaskFormDialog } from "./MaintenanceTaskFormDialog"

interface PerVehicle {
  vehicleId: string
  status: ReturnType<typeof computeMaintenanceState>["status"]
  remainingPct: number
}

export function MaintenanceTaskCard({ task }: { task: MaintenanceTask }) {
  const { t } = useTranslation()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: vehicles } = useVehicles()
  const confirmTask = useConfirmMaintenanceTask()
  const deleteTask = useDeleteMaintenanceTask()

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>()
    for (const v of vehicles ?? []) map.set(v.id, v)
    return map
  }, [vehicles])

  const rows = useMemo<PerVehicle[]>(() => {
    return task.vehicles
      .map((state) => {
        const vehicle = vehicleMap.get(state.vehicleId)
        const comp = computeMaintenanceState(task, state, vehicle)
        return {
          vehicleId: state.vehicleId,
          status: comp.status,
          remainingPct: comp.remainingPct,
        }
      })
      .sort((a, b) => a.remainingPct - b.remainingPct)
  }, [task, vehicleMap])

  const counts = useMemo(() => {
    const c = { ok: 0, waiting: 0, delay: 0 }
    for (const r of rows) c[r.status] += 1
    return c
  }, [rows])

  const dueCount = counts.waiting + counts.delay

  function handleConfirm() {
    if (dueCount === 0) return
    confirmTask.mutate(
      { taskId: task.id },
      {
        onSuccess: () => {
          toast.success(
            t("maintenance.toast.confirmedServiced", { count: dueCount })
          )
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("maintenance.toast.operationFailed")
          ),
      }
    )
  }

  function handleDelete() {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success(t("maintenance.toast.deleted"))
        setDeleteOpen(false)
      },
      onError: (err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : t("maintenance.toast.operationFailed")
        ),
    })
  }

  const intervalLabel =
    task.paramType === "mileage"
      ? t("maintenance.card.everyKm", {
          km: (task.intervalKm ?? 0).toLocaleString("en-US"),
        })
      : t("maintenance.card.everyDays", { count: task.intervalDays ?? 0 })

  const alertLabel =
    task.paramType === "mileage"
      ? t("maintenance.card.warnsKmBefore", { km: formatKm(task.alertBefore) })
      : t("maintenance.card.warnsDaysBefore", { count: task.alertBefore })

  const ParamIcon = task.paramType === "mileage" ? Gauge : CalendarClock

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-start justify-between gap-2 pt-5">
        <div className="min-w-0 space-y-1.5">
          <Link
            to={`/maintenance/${task.id}`}
            className="block truncate font-heading text-base font-semibold hover:underline"
          >
            {task.title}
          </Link>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="gap-1 font-normal">
              <ParamIcon className="size-3" />
              {intervalLabel}
            </Badge>
            {task.repeat && (
              <Badge variant="outline" className="font-normal">
                {t("maintenance.card.recurring")}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 font-normal">
              <Bell className="size-3" />
              {alertLabel}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("maintenance.card.taskActions")}
              className="-mt-1 -mr-1"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="pb-5">
        {task.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {task.description}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-4">
          <MaintenanceStatusPie
            counts={counts}
            className="aspect-square h-[140px] shrink-0"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("maintenance.card.vehiclesCount", { count: rows.length })}
            </p>
            <ul className="space-y-1.5 text-sm">
              {(["ok", "waiting", "delay"] as const).map((status) => (
                <li
                  key={status}
                  className="flex items-center justify-between gap-2"
                >
                  <MaintenanceStatusBadge status={status} />
                  <span className="font-medium tabular-nums">
                    {counts[status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Button
          variant={dueCount > 0 ? "default" : "outline"}
          className="mt-4 w-full"
          disabled={dueCount === 0 || confirmTask.isPending}
          onClick={handleConfirm}
        >
          <CheckCircle2 className="size-4" />
          {dueCount > 0
            ? t("maintenance.card.confirmDue", { count: dueCount })
            : t("maintenance.card.allUpToDate")}
        </Button>

        {rows.length > 0 && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-between text-muted-foreground"
          >
            <Link to={`/maintenance/${task.id}`}>
              {t("maintenance.card.viewVehicles", { count: rows.length })}
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        )}
      </CardContent>

      <MaintenanceTaskFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("maintenance.detail.deleteTitle")}
        description={t("maintenance.detail.deleteDescription", {
          title: task.title,
          count: rows.length,
        })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={handleDelete}
        isPending={deleteTask.isPending}
      />
    </Card>
  )
}
