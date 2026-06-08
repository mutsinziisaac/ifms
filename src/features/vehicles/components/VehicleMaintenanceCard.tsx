import { useMemo } from "react"
import { Wrench } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useMaintenanceTasks } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { computeMaintenanceState, MAINTENANCE_STATUS_CONFIG } from "@/lib/status"
import { cn } from "@/lib/utils"

// Worst-first so problems surface at the top.
const STATUS_ORDER = { delay: 0, waiting: 1, ok: 2 } as const

export function VehicleMaintenanceCard({ vehicle }: { vehicle: Vehicle }) {
  const tasksQuery = useMaintenanceTasks()

  const items = useMemo(() => {
    const tasks = tasksQuery.data ?? []
    return tasks
      .flatMap((task) => {
        const state = task.vehicles.find((s) => s.vehicleId === vehicle.id)
        if (!state) return []
        const comp = computeMaintenanceState(task, state, vehicle)
        return [{ id: task.id, title: task.title, comp }]
      })
      .sort((a, b) => STATUS_ORDER[a.comp.status] - STATUS_ORDER[b.comp.status])
  }, [tasksQuery.data, vehicle])

  const header = (
    <div className="mb-3 flex items-center gap-2">
      <Wrench className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">Maintenance</span>
    </div>
  )

  return (
    <Card className="h-full gap-0 p-5">
      {header}
      {tasksQuery.isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">
          This vehicle is not enrolled in any maintenance schedule.
        </p>
      ) : (
        <ul className="divide-y">
          {items.map(({ id, title, comp }) => {
            const config = MAINTENANCE_STATUS_CONFIG[comp.status]
            return (
              <li
                key={id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground">
                    {comp.remainingLabel}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    config.badgeClass
                  )}
                >
                  {config.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
