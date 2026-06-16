import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Gauge,
  Pencil,
  Receipt,
  RefreshCw,
  Trash2,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { EmptyState } from "@/components/common/EmptyState"
import { EntityBadge } from "@/components/common/EntityBadge"
import { RelativeTime } from "@/components/common/RelativeTime"
import { StatCard } from "@/components/common/StatCard"
import { MaintenanceStatusBadge } from "@/components/common/status-badges"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useConfirmMaintenanceTask,
  useDeleteMaintenanceTask,
  useEntities,
  useMaintenanceServiceRecords,
  useMaintenanceTasks,
  useVehicles,
} from "@/data/hooks"
import {
  MAINTENANCE_STATUSES,
  type MaintenanceServiceRecord,
  type MaintenanceStatus,
  type Vehicle,
} from "@/data/types"
import { formatDate, formatEtb, formatKm } from "@/lib/format"
import { computeMaintenanceState } from "@/lib/status"

import { LogServiceDialog } from "./components/LogServiceDialog"
import { MaintenanceStatusPie } from "./components/MaintenanceStatusPie"
import { MaintenanceTaskFormDialog } from "./components/MaintenanceTaskFormDialog"

interface VehicleRow {
  id: string
  plate: string
  entityName: string
  status: MaintenanceStatus
  remainingLabel: string
  dueLabel: string
  remainingPct: number
  odometerKm: number | null
  lastRecord: MaintenanceServiceRecord | undefined
}

interface LogTarget {
  vehicleId: string
  plate: string
  odometerKm: number | null
}

export function MaintenanceTaskDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const tasksQuery = useMaintenanceTasks()
  const task = tasksQuery.data?.find((t) => t.id === id)
  const vehicles = useVehicles().data
  const entities = useEntities().data
  const recordsData = useMaintenanceServiceRecords(id).data
  const records = useMemo(() => recordsData ?? [], [recordsData])

  const deleteTask = useDeleteMaintenanceTask()
  const confirmTask = useConfirmMaintenanceTask()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>()
    for (const v of vehicles ?? []) map.set(v.id, v)
    return map
  }, [vehicles])

  const entityNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of entities ?? []) map.set(e.id, e.shortName)
    return map
  }, [entities])

  // Latest record per vehicle (records arrive newest-first).
  const latestByVehicle = useMemo(() => {
    const map = new Map<string, MaintenanceServiceRecord>()
    for (const r of records) if (!map.has(r.vehicleId)) map.set(r.vehicleId, r)
    return map
  }, [records])

  const rows = useMemo<VehicleRow[]>(() => {
    if (!task) return []
    return task.vehicles
      .map((state) => {
        const vehicle = vehicleMap.get(state.vehicleId)
        const comp = computeMaintenanceState(task, state, vehicle)
        return {
          id: state.vehicleId,
          plate: vehicle?.plate ?? t("common.na"),
          entityName: vehicle ? (entityNames.get(vehicle.entityId) ?? "") : "",
          status: comp.status,
          remainingLabel: comp.remainingLabel,
          dueLabel: comp.dueLabel,
          remainingPct: comp.remainingPct,
          odometerKm: vehicle?.odometerKm ?? null,
          lastRecord: latestByVehicle.get(state.vehicleId),
        }
      })
      .sort((a, b) => a.remainingPct - b.remainingPct)
  }, [task, vehicleMap, entityNames, latestByVehicle, t])

  const counts = useMemo(() => {
    const c = { ok: 0, waiting: 0, delay: 0 }
    for (const r of rows) c[r.status] += 1
    return c
  }, [rows])

  const totalSpend = useMemo(
    () => records.reduce((sum, r) => sum + r.cost, 0),
    [records]
  )

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (q && !`${r.plate} ${r.entityName}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [rows, search, statusFilter])

  if (tasksQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  if (!task) {
    return (
      <EmptyState
        icon={Wrench}
        title={t("maintenance.detail.notFoundTitle")}
        description={t("maintenance.detail.notFoundDescription")}
        action={
          <Button asChild variant="outline">
            <Link to="/maintenance">
              <ChevronLeft className="size-4" />
              {t("maintenance.detail.backToMaintenance")}
            </Link>
          </Button>
        }
      />
    )
  }

  const dueCount = counts.waiting + counts.delay
  const isMileage = task.paramType === "mileage"
  const ParamIcon = isMileage ? Gauge : CalendarClock
  const intervalLabel = isMileage
    ? t("maintenance.detail.everyKm", {
        km: (task.intervalKm ?? 0).toLocaleString("en-US"),
      })
    : t("maintenance.detail.everyDays", { count: task.intervalDays ?? 0 })
  const alertLabel = isMileage
    ? t("maintenance.detail.alertsKmBefore", { km: formatKm(task.alertBefore) })
    : t("maintenance.detail.alertsDaysBefore", { count: task.alertBefore })

  function handleDelete() {
    deleteTask.mutate(task!.id, {
      onSuccess: () => {
        toast.success(t("maintenance.toast.deleted"))
        navigate("/maintenance")
      },
      onError: (err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : t("maintenance.toast.operationFailed")
        ),
    })
  }

  function handleConfirmAll() {
    if (dueCount === 0) return
    confirmTask.mutate(
      { taskId: task!.id },
      {
        onSuccess: () =>
          toast.success(
            t("maintenance.toast.confirmedServiced", { count: dueCount })
          ),
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("maintenance.toast.operationFailed")
          ),
      }
    )
  }

  const columns: DataTableColumn<VehicleRow>[] = [
    {
      key: "plate",
      header: t("maintenance.detail.colVehicle"),
      render: (r) => (
        <span className="font-medium tabular-nums">{r.plate}</span>
      ),
    },
    {
      key: "entity",
      header: t("maintenance.detail.colProvider"),
      render: (r) =>
        r.entityName ? <EntityBadge name={r.entityName} /> : <span>—</span>,
    },
    {
      key: "status",
      header: t("maintenance.detail.colStatus"),
      render: (r) => <MaintenanceStatusBadge status={r.status} />,
    },
    {
      key: "remaining",
      header: t("maintenance.detail.colRemaining"),
      render: (r) => <span className="text-sm">{r.remainingLabel}</span>,
    },
    {
      key: "due",
      header: t("maintenance.detail.colDue"),
      className: "text-muted-foreground",
      render: (r) => <span className="text-sm">{r.dueLabel}</span>,
    },
    {
      key: "last",
      header: t("maintenance.detail.colLastService"),
      render: (r) =>
        r.lastRecord ? (
          <div className="text-sm">
            <RelativeTime iso={r.lastRecord.servicedAt} />
            <span className="block text-xs text-muted-foreground tabular-nums">
              {formatEtb(r.lastRecord.cost)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("maintenance.detail.noRecord")}
          </span>
        ),
    },
    {
      key: "action",
      header: "",
      className: "text-right",
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setLogTarget({
              vehicleId: r.id,
              plate: r.plate,
              odometerKm: r.odometerKm,
            })
          }
        >
          <CheckCircle2 className="size-4" />
          {t("maintenance.detail.logService")}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 text-muted-foreground"
          >
            <Link to="/maintenance">
              <ChevronLeft className="size-4" />
              {t("maintenance.detail.breadcrumb")}
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {task.title}
            </h1>
            {task.description ? (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {task.description}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="gap-1 font-normal">
              <ParamIcon className="size-3" />
              {intervalLabel}
            </Badge>
            {task.repeat ? (
              <Badge variant="outline" className="gap-1 font-normal">
                <RefreshCw className="size-3" />
                {t("maintenance.detail.recurring")}
              </Badge>
            ) : null}
            <Badge variant="outline" className="gap-1 font-normal">
              <Bell className="size-3" />
              {alertLabel}
            </Badge>
            <Badge variant="outline" className="gap-1 font-normal">
              {task.confirmation === "automatic" ? (
                <Zap className="size-3" />
              ) : (
                <CheckCircle2 className="size-3" />
              )}
              {task.confirmation === "automatic"
                ? t("maintenance.detail.automaticConfirmation")
                : t("maintenance.detail.manualConfirmation")}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            {t("common.delete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={t("maintenance.stats.vehiclesOk")}
          value={counts.ok}
          icon={CheckCircle2}
          intent="success"
        />
        <StatCard
          label={t("maintenance.stats.waiting")}
          value={counts.waiting}
          icon={Bell}
          intent="warning"
        />
        <StatCard
          label={t("maintenance.stats.delay")}
          value={counts.delay}
          icon={CalendarClock}
          intent="danger"
        />
        <StatCard
          label={t("maintenance.stats.totalSpend")}
          value={formatEtb(totalSpend)}
          icon={Wallet}
          hint={t("maintenance.stats.totalSpendHint")}
        />
        <StatCard
          label={t("maintenance.stats.servicesLogged")}
          value={records.length}
          icon={Receipt}
          hint={t("maintenance.stats.servicesLoggedHint")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="gap-0 lg:col-span-1">
          <CardHeader>
            <CardTitle>{t("maintenance.detail.statusMix")}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <MaintenanceStatusPie
              counts={counts}
              className="aspect-square h-[140px] shrink-0"
            />
            <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
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
          </CardContent>
        </Card>

        <Card className="gap-0 lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>{t("maintenance.detail.vehiclesOnSchedule")}</CardTitle>
            <Button
              size="sm"
              variant={dueCount > 0 ? "default" : "outline"}
              disabled={dueCount === 0 || confirmTask.isPending}
              onClick={handleConfirmAll}
            >
              <CheckCircle2 className="size-4" />
              {dueCount > 0
                ? t("maintenance.detail.confirmDue", { count: dueCount })
                : t("maintenance.detail.allUpToDate")}
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            <DataTable
              data={filteredRows}
              columns={columns}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder={t("maintenance.detail.searchPlaceholder")}
              filters={[
                {
                  key: "status",
                  label: t("maintenance.detail.colStatus"),
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: MAINTENANCE_STATUSES.map((s) => ({
                    value: s,
                    label: t(`enums.maintenanceStatus.${s}`),
                  })),
                },
              ]}
              pageSize={8}
              emptyTitle={t("maintenance.detail.vehiclesNoMatchTitle")}
              emptyDescription={t(
                "maintenance.detail.vehiclesNoMatchDescription"
              )}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle>{t("maintenance.detail.serviceHistory")}</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("maintenance.detail.recordsCount", { count: records.length })}
          </span>
        </CardHeader>
        <CardContent className="pt-2">
          {records.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t("maintenance.detail.noServicesTitle")}
              description={t("maintenance.detail.noServicesDescription")}
            />
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {records.map((r) => {
                const plate = vehicleMap.get(r.vehicleId)?.plate ?? "—"
                return (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className="tabular-nums">{plate}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {r.workshop}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.servicedAt)}
                        {r.odometerKm != null
                          ? ` · ${formatKm(r.odometerKm)}`
                          : ""}
                        {r.technician ? ` · ${r.technician}` : ""}
                      </p>
                      {r.notes ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.notes}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatEtb(r.cost)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

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

      {logTarget ? (
        <LogServiceDialog
          open={logTarget !== null}
          onOpenChange={(open) => {
            if (!open) setLogTarget(null)
          }}
          task={task}
          vehicleId={logTarget.vehicleId}
          vehiclePlate={logTarget.plate}
          currentOdometerKm={logTarget.odometerKm}
        />
      ) : null}
    </div>
  )
}
