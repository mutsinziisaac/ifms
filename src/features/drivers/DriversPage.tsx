import { useMemo, useState } from "react"
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
import { DRIVER_STATUS_CONFIG } from "@/lib/status"
import { cn } from "@/lib/utils"

import { DriverFormDialog } from "./components/DriverFormDialog"

const EXPIRY_SOON_DAYS = 60

type AssignmentFilter = "all" | "with" | "without"

export function DriversPage() {
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
      header: "Name",
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
      header: "Entity",
      render: (driver) => (
        <EntityBadge name={entityNameById.get(driver.entityId) ?? "—"} />
      ),
    },
    {
      key: "license",
      header: "License",
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
                {expired ? `Expired ${-days}d ago` : `Expires in ${days}d`}
              </p>
            )}
          </div>
        )
      },
    },
    {
      key: "phone",
      header: "Phone",
      render: (driver) => (
        <span className="text-sm tabular-nums">{driver.phone || "—"}</span>
      ),
    },
    {
      key: "vehicle",
      header: "Assigned vehicle",
      render: (driver) =>
        driver.assignedVehicleId ? (
          <span className="text-sm font-medium tabular-nums">
            {plateByVehicleId.get(driver.assignedVehicleId) ?? "—"}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (driver) => <DriverStatusBadge status={driver.status} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Driver profiles, vehicle assignments and safety records."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add driver
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total drivers" value={stats.total} icon={IdCard} />
        <StatCard
          label="Active"
          value={stats.active}
          icon={UserCheck}
          intent="success"
        />
        <StatCard label="Assigned" value={stats.assigned} icon={Truck} />
        <StatCard
          label="Unassigned"
          value={stats.unassigned}
          icon={UserMinus}
          intent="warning"
        />
        <StatCard
          label="Licenses expiring"
          value={stats.expiringSoon}
          icon={AlertTriangle}
          intent="danger"
          hint="within 60 days"
        />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={driversQuery.isLoading}
        onRowClick={(driver) => navigate(`/drivers/${driver.id}`)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, license, phone…"
        filters={[
          {
            key: "assignment",
            label: "Assignment",
            value: assignment,
            onChange: (v) => setAssignment(v as AssignmentFilter),
            options: [
              { value: "with", label: "With assignment" },
              { value: "without", label: "Without assignment" },
            ],
          },
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as DriverStatus | "all"),
            options: DRIVER_STATUSES.map((status) => ({
              value: status,
              label: DRIVER_STATUS_CONFIG[status].label,
            })),
          },
          {
            key: "entity",
            label: "Entity",
            value: entityFilter,
            onChange: setEntityFilter,
            options: entities.map((entity) => ({
              value: entity.id,
              label: entity.shortName,
            })),
          },
        ]}
        emptyTitle="No drivers found"
        emptyDescription="Adjust your filters or add a new driver to get started."
      />

      <DriverFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
