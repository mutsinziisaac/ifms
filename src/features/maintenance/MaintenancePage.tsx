import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, Clock, Plus, Wrench } from "lucide-react"

import { EmptyState } from "@/components/common/EmptyState"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMaintenanceTasks, useVehicles } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { computeMaintenanceState } from "@/lib/status"

import { MaintenanceTaskCard } from "./components/MaintenanceTaskCard"
import { MaintenanceTaskFormDialog } from "./components/MaintenanceTaskFormDialog"

export function MaintenancePage() {
  const [createOpen, setCreateOpen] = useState(false)

  const { data: tasks, isLoading } = useMaintenanceTasks()
  const { data: vehicles } = useVehicles()

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>()
    for (const v of vehicles ?? []) map.set(v.id, v)
    return map
  }, [vehicles])

  const stats = useMemo(() => {
    let ok = 0
    let waiting = 0
    let delay = 0
    for (const task of tasks ?? []) {
      for (const state of task.vehicles) {
        const comp = computeMaintenanceState(
          task,
          state,
          vehicleMap.get(state.vehicleId)
        )
        if (comp.status === "ok") ok += 1
        else if (comp.status === "waiting") waiting += 1
        else delay += 1
      }
    }
    return { ok, waiting, delay }
  }, [tasks, vehicleMap])

  const taskList = tasks ?? []

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Preventive maintenance schedules across the monitored fleet."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New task
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total tasks"
          value={isLoading ? "—" : taskList.length}
          icon={Wrench}
          hint="Active schedules"
        />
        <StatCard
          label="Vehicles OK"
          value={isLoading ? "—" : stats.ok}
          icon={CheckCircle2}
          intent="success"
          hint="Within service window"
        />
        <StatCard
          label="Waiting"
          value={isLoading ? "—" : stats.waiting}
          icon={Clock}
          intent="warning"
          hint="Approaching due"
        />
        <StatCard
          label="Delay / overdue"
          value={isLoading ? "—" : stats.delay}
          icon={AlertTriangle}
          intent="danger"
          hint="Past due date"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </div>
        ) : taskList.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Wrench}
                title="No maintenance tasks yet"
                description="Create a preventive maintenance schedule and assign it to vehicles in the monitored fleet."
                action={
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    New task
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {taskList.map((task) => (
              <MaintenanceTaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      <MaintenanceTaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}

function TaskCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="pt-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-5 w-28" />
      </CardHeader>
      <CardContent className="pb-5">
        <Skeleton className="h-4 w-full" />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="size-[140px] shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
        <Skeleton className="mt-4 h-9 w-full" />
      </CardContent>
    </Card>
  )
}
