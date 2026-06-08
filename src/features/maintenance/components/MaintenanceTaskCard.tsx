import { useMemo, useState } from "react"
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { computeMaintenanceState } from "@/lib/status"
import { cn } from "@/lib/utils"

import { MaintenanceStatusPie } from "./MaintenanceStatusPie"
import { MaintenanceTaskFormDialog } from "./MaintenanceTaskFormDialog"

interface PerVehicle {
  vehicleId: string
  plate: string
  status: ReturnType<typeof computeMaintenanceState>["status"]
  remainingLabel: string
  remainingPct: number
}

export function MaintenanceTaskCard({ task }: { task: MaintenanceTask }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

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
          plate: vehicle?.plate ?? "Unknown vehicle",
          status: comp.status,
          remainingLabel: comp.remainingLabel,
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
            `${dueCount} vehicle${dueCount === 1 ? "" : "s"} confirmed serviced`
          )
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Operation failed"),
      }
    )
  }

  function handleConfirmOne(vehicleId: string) {
    confirmTask.mutate(
      { taskId: task.id, vehicleIds: [vehicleId] },
      {
        onSuccess: () => toast.success("Vehicle confirmed serviced"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Operation failed"),
      }
    )
  }

  function handleDelete() {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success("Maintenance task deleted")
        setDeleteOpen(false)
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Operation failed"),
    })
  }

  const intervalLabel =
    task.paramType === "mileage"
      ? `Every ${(task.intervalKm ?? 0).toLocaleString("en-US")} km`
      : `Every ${task.intervalDays ?? 0} day${task.intervalDays === 1 ? "" : "s"}`

  const ParamIcon = task.paramType === "mileage" ? Gauge : CalendarClock

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-start justify-between gap-2 pt-5">
        <div className="min-w-0 space-y-1.5">
          <h3 className="truncate font-heading text-base font-semibold">
            {task.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="gap-1 font-normal">
              <ParamIcon className="size-3" />
              {intervalLabel}
            </Badge>
            {task.repeat && (
              <Badge variant="outline" className="font-normal">
                Recurring
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Task actions"
              className="-mt-1 -mr-1"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete
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
              <span className="font-medium text-foreground tabular-nums">
                {rows.length}
              </span>{" "}
              vehicle{rows.length === 1 ? "" : "s"}
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
          {dueCount > 0 ? `Confirm ${dueCount} due` : "All vehicles up to date"}
        </Button>

        {rows.length > 0 && (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-between text-muted-foreground"
              >
                {expanded ? "Hide vehicles" : "View vehicles"}
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-2 divide-y rounded-lg border">
                {rows.map((row) => {
                  const due = row.status !== "ok"
                  return (
                    <li
                      key={row.vehicleId}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium tabular-nums">
                          {row.plate}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.remainingLabel}
                        </p>
                      </div>
                      <MaintenanceStatusBadge status={row.status} />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Confirm serviced"
                        disabled={!due || confirmTask.isPending}
                        onClick={() => handleConfirmOne(row.vehicleId)}
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
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
        title="Delete maintenance task"
        description={`“${task.title}” and its schedule for ${rows.length} vehicle${
          rows.length === 1 ? "" : "s"
        } will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        isPending={deleteTask.isPending}
      />
    </Card>
  )
}
