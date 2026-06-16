import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Wallet,
  Wrench,
} from "lucide-react"

import { EmptyState } from "@/components/common/EmptyState"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useMaintenanceServiceRecords,
  useMaintenanceTasks,
  useVehicles,
} from "@/data/hooks"
import type { MaintenanceStatus, MaintenanceTask, Vehicle } from "@/data/types"
import { formatEtb } from "@/lib/format"
import { computeMaintenanceState } from "@/lib/status"

import { MaintenanceTaskCard } from "./components/MaintenanceTaskCard"
import { MaintenanceTaskFormDialog } from "./components/MaintenanceTaskFormDialog"

const DAY_MS = 24 * 60 * 60 * 1000

interface TaskView {
  task: MaintenanceTask
  worstPct: number
  statuses: Set<MaintenanceStatus>
}

/** Sum of service-record cost (ETB) within the last `days` days. */
function spendInLastDays(
  records: { servicedAt: string; cost: number }[],
  days: number
): number {
  const cutoff = Date.now() - days * DAY_MS
  let sum = 0
  for (const r of records) {
    if (new Date(r.servicedAt).getTime() >= cutoff) sum += r.cost
  }
  return sum
}

export function MaintenancePage() {
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paramFilter, setParamFilter] = useState("all")
  const [sort, setSort] = useState("due")

  const { data: tasks, isLoading } = useMaintenanceTasks()
  const { data: vehicles } = useVehicles()
  const { data: records } = useMaintenanceServiceRecords()

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>()
    for (const v of vehicles ?? []) map.set(v.id, v)
    return map
  }, [vehicles])

  const taskViews = useMemo<TaskView[]>(() => {
    return (tasks ?? []).map((task) => {
      let worst = Number.POSITIVE_INFINITY
      const statuses = new Set<MaintenanceStatus>()
      for (const state of task.vehicles) {
        const comp = computeMaintenanceState(
          task,
          state,
          vehicleMap.get(state.vehicleId)
        )
        statuses.add(comp.status)
        if (comp.remainingPct < worst) worst = comp.remainingPct
      }
      return { task, worstPct: worst, statuses }
    })
  }, [tasks, vehicleMap])

  const stats = useMemo(() => {
    let ok = 0
    let waiting = 0
    let delay = 0
    for (const view of taskViews) {
      for (const state of view.task.vehicles) {
        const comp = computeMaintenanceState(
          view.task,
          state,
          vehicleMap.get(state.vehicleId)
        )
        if (comp.status === "ok") ok += 1
        else if (comp.status === "waiting") waiting += 1
        else delay += 1
      }
    }
    return { ok, waiting, delay }
  }, [taskViews, vehicleMap])

  const spend90 = useMemo(() => spendInLastDays(records ?? [], 90), [records])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = taskViews.filter((v) => {
      if (q && !v.task.title.toLowerCase().includes(q)) return false
      if (paramFilter !== "all" && v.task.paramType !== paramFilter)
        return false
      if (
        statusFilter !== "all" &&
        !v.statuses.has(statusFilter as MaintenanceStatus)
      )
        return false
      return true
    })
    return [...list].sort((a, b) => {
      if (sort === "title") return a.task.title.localeCompare(b.task.title)
      return a.worstPct - b.worstPct
    })
  }, [taskViews, search, paramFilter, statusFilter, sort])

  const taskList = tasks ?? []

  return (
    <div>
      <PageHeader
        title={t("maintenance.title")}
        description={t("maintenance.description")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("maintenance.newTask")}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={t("maintenance.stats.totalTasks")}
          value={isLoading ? "—" : taskList.length}
          icon={Wrench}
          hint={t("maintenance.stats.totalTasksHint")}
        />
        <StatCard
          label={t("maintenance.stats.vehiclesOk")}
          value={isLoading ? "—" : stats.ok}
          icon={CheckCircle2}
          intent="success"
          hint={t("maintenance.stats.vehiclesOkHint")}
        />
        <StatCard
          label={t("maintenance.stats.waiting")}
          value={isLoading ? "—" : stats.waiting}
          icon={Clock}
          intent="warning"
          hint={t("maintenance.stats.waitingHint")}
        />
        <StatCard
          label={t("maintenance.stats.delay")}
          value={isLoading ? "—" : stats.delay}
          icon={AlertTriangle}
          intent="danger"
          hint={t("maintenance.stats.delayHint")}
        />
        <StatCard
          label={t("maintenance.stats.spend90")}
          value={isLoading ? "—" : formatEtb(spend90)}
          icon={Wallet}
          hint={t("maintenance.stats.spend90Hint")}
        />
      </div>

      {!isLoading && taskList.length > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("maintenance.filters.searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 min-w-36">
              <SelectValue>
                {statusFilter === "all"
                  ? t("maintenance.filters.statusAll")
                  : t("maintenance.filters.statusValue", {
                      value: t(
                        `enums.maintenanceStatus.${statusFilter as MaintenanceStatus}`
                      ),
                    })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {(["ok", "waiting", "delay"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`enums.maintenanceStatus.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paramFilter} onValueChange={setParamFilter}>
            <SelectTrigger className="h-9 min-w-32">
              <SelectValue>
                {paramFilter === "all"
                  ? t("maintenance.filters.triggerAll")
                  : t("maintenance.filters.triggerValue", {
                      value:
                        paramFilter === "mileage"
                          ? t("maintenance.filters.triggerMileage")
                          : t("maintenance.filters.triggerDate"),
                    })}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="mileage">
                {t("maintenance.filters.triggerMileage")}
              </SelectItem>
              <SelectItem value="date">
                {t("maintenance.filters.triggerDate")}
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 min-w-40">
              <SelectValue>
                {sort === "title"
                  ? t("maintenance.filters.sortTitle")
                  : t("maintenance.filters.sortDue")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due">
                {t("maintenance.filters.sortOptionDue")}
              </SelectItem>
              <SelectItem value="title">
                {t("maintenance.filters.sortOptionTitle")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="mt-4">
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
                title={t("maintenance.empty.title")}
                description={t("maintenance.empty.description")}
                action={
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    {t("maintenance.newTask")}
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : visible.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Search}
                title={t("maintenance.empty.noMatchTitle")}
                description={t("maintenance.empty.noMatchDescription")}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((view) => (
              <MaintenanceTaskCard key={view.task.id} task={view.task} />
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
