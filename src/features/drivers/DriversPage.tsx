import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  IdCard,
  Plus,
  Truck,
  UserCheck,
  UserMinus,
} from "lucide-react"

import { DataTable } from "@/components/common/DataTable"
import type { DataTableColumn } from "@/components/common/DataTable"
import { EntityBadge } from "@/components/common/EntityBadge"
import { StatCard } from "@/components/common/StatCard"
import { DriverStatusBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useDrivers, useEntities, useVehicles } from "@/data/hooks"
import type { Driver, DriverStatus } from "@/data/types"
import { DRIVER_STATUSES } from "@/data/types"
import { daysUntil, formatDate, fullName, initials } from "@/lib/format"
import { cn } from "@/lib/utils"

import { DriverFormDialog } from "./components/DriverFormDialog"

const EXPIRY_SOON_DAYS = 60

type AssignmentFilter = "all" | "with" | "without"

export function DriversPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const driversQuery = useDrivers()
  const entities = useEntities().data ?? []
  const vehicles = useVehicles().data ?? []

  const drivers = driversQuery.data ?? []

  const [search, setSearch] = useState("")
  const [assignment, setAssignment] = useState<AssignmentFilter>("all")
  const [statusFilter, setStatusFilter] = useState<DriverStatus | "all">("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [createOpen, setCreateOpen] = useState(false)

  const entityNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const entity of entities) map.set(entity.id, entity.shortName)
    return map
  }, [entities])

  const plateByVehicleId = useMemo(() => {
    const map = new Map<string, string>()
    for (const vehicle of vehicles) map.set(vehicle.id, vehicle.plate)
    return map
  }, [vehicles])

  const stats = useMemo(() => {
    let active = 0
    let assigned = 0
    let expiringSoon = 0
    for (const driver of drivers) {
      if (driver.status === "active") active++
      if (driver.assignedVehicleId !== null) assigned++
      const days = daysUntil(driver.licenseExpiry)
      if (days < EXPIRY_SOON_DAYS) expiringSoon++
    }
    return {
      total: drivers.length,
      active,
      assigned,
      unassigned: drivers.length - assigned,
      expiringSoon,
    }
  }, [drivers])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return drivers.filter((driver) => {
      if (needle) {
        const haystack =
          `${fullName(driver)} ${driver.licenseNo} ${driver.phone}`.toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      if (assignment === "with" && driver.assignedVehicleId === null) {
        return false
      }
      if (assignment === "without" && driver.assignedVehicleId !== null) {
        return false
      }
      if (statusFilter !== "all" && driver.status !== statusFilter) {
        return false
      }
      if (entityFilter !== "all" && driver.entityId !== entityFilter) {
        return false
      }
      return true
    })
  }, [drivers, search, assignment, statusFilter, entityFilter])

  const columns: DataTableColumn<Driver>[] = [
    {
      key: "name",
      header: t("drivers.table.name"),
      render: (driver) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">
              {initials(fullName(driver))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium">{fullName(driver)}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {driver.licenseNo}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "entity",
      header: t("drivers.table.entity"),
      render: (driver) => (
        <EntityBadge name={entityNameById.get(driver.entityId) ?? "—"} />
      ),
    },
    {
      key: "license",
      header: t("drivers.table.license"),
      render: (driver) => {
        const days = daysUntil(driver.licenseExpiry)
        const expired = days < 0
        const soon = days >= 0 && days < EXPIRY_SOON_DAYS
        return (
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-medium">{driver.licenseCategory}</span>
              <span className="text-muted-foreground">
                {" "}
                · {formatDate(driver.licenseExpiry)}
              </span>
            </p>
            {(expired || soon) && (
              <p
                className={cn(
                  "text-xs font-medium",
                  expired
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {expired
                  ? t("drivers.license.expiredAgo", { count: -days })
                  : t("drivers.license.expiresIn", { count: days })}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: "phone",
      header: t("drivers.table.phone"),
      render: (driver) => (
        <span className="text-sm tabular-nums">{driver.phone || "—"}</span>
      ),
    },
    {
      key: "vehicle",
      header: t("drivers.table.assignedVehicle"),
      render: (driver) =>
        driver.assignedVehicleId ? (
          <span className="text-sm font-medium tabular-nums">
            {plateByVehicleId.get(driver.assignedVehicleId) ?? "—"}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("common.unassigned")}
          </span>
        ),
    },
    {
      key: "status",
      header: t("drivers.table.status"),
      render: (driver) => <DriverStatusBadge status={driver.status} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title={t("drivers.title")}
        description={t("drivers.description")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("drivers.addDriver")}
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={t("drivers.stats.total")}
          value={stats.total}
          icon={IdCard}
        />
        <StatCard
          label={t("drivers.stats.active")}
          value={stats.active}
          icon={UserCheck}
          intent="success"
        />
        <StatCard
          label={t("drivers.stats.assigned")}
          value={stats.assigned}
          icon={Truck}
        />
        <StatCard
          label={t("drivers.stats.unassigned")}
          value={stats.unassigned}
          icon={UserMinus}
          intent="warning"
        />
        <StatCard
          label={t("drivers.stats.expiring")}
          value={stats.expiringSoon}
          icon={AlertTriangle}
          intent="danger"
          hint={t("drivers.stats.expiringHint", { count: EXPIRY_SOON_DAYS })}
        />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={driversQuery.isLoading}
        onRowClick={(driver) => navigate(`/drivers/${driver.id}`)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("drivers.table.searchPlaceholder")}
        filters={[
          {
            key: "assignment",
            label: t("drivers.filters.assignment"),
            value: assignment,
            onChange: (v) => setAssignment(v as AssignmentFilter),
            options: [
              { value: "with", label: t("drivers.filters.withAssignment") },
              {
                value: "without",
                label: t("drivers.filters.withoutAssignment"),
              },
            ],
          },
          {
            key: "status",
            label: t("drivers.filters.status"),
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as DriverStatus | "all"),
            options: DRIVER_STATUSES.map((status) => ({
              value: status,
              label: t(`enums.driverStatus.${status}`),
            })),
          },
          {
            key: "entity",
            label: t("drivers.filters.entity"),
            value: entityFilter,
            onChange: setEntityFilter,
            options: entities.map((entity) => ({
              value: entity.id,
              label: entity.shortName,
            })),
          },
        ]}
        emptyTitle={t("drivers.table.emptyTitle")}
        emptyDescription={t("drivers.table.emptyDescription")}
      />

      <DriverFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
