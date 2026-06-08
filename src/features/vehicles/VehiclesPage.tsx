import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Building2,
  Navigation,
  PauseCircle,
  Plus,
  PowerOff,
  Truck,
  WifiOff,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/common/DataTable"
import { EntityBadge } from "@/components/common/EntityBadge"
import { RelativeTime } from "@/components/common/RelativeTime"
import { StatCard } from "@/components/common/StatCard"
import { VehicleStatusBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { useDrivers, useEntities, useVehicles } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import {
  ETHIOPIA_REGIONS,
  GPS_PROVIDERS,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
} from "@/data/types"
import { fullName, formatSpeed } from "@/lib/format"
import { VEHICLE_STATUS_CONFIG } from "@/lib/status"

import { VehicleFormDialog } from "./components/VehicleFormDialog"

const ALL = "all"

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  truck: "Truck",
  trailer: "Trailer",
  tanker: "Tanker",
  bus: "Bus",
  container: "Container",
  pickup: "Pickup",
}

export function VehiclesPage() {
  const navigate = useNavigate()

  const vehiclesQuery = useVehicles()
  const vehicles = vehiclesQuery.data ?? []
  const entities = useEntities().data ?? []
  const drivers = useDrivers().data ?? []

  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [typeFilter, setTypeFilter] = useState(ALL)
  const [entityFilter, setEntityFilter] = useState(ALL)
  const [regionFilter, setRegionFilter] = useState(ALL)
  const [gpsFilter, setGpsFilter] = useState(ALL)

  const entityById = useMemo(
    () => new Map(entities.map((e) => [e.id, e])),
    [entities]
  )
  const driverById = useMemo(
    () => new Map(drivers.map((d) => [d.id, d])),
    [drivers]
  )

  // Stat cards — every vehicle falls into exactly one of these buckets, so the
  // breakdown reconciles with the total. "Stopped" folds the two parked states
  // (ignition off + ignition blocked).
  const movingCount = vehicles.filter((v) => v.status === "moving").length
  const idlingCount = vehicles.filter((v) => v.status === "idling").length
  const stoppedCount = vehicles.filter(
    (v) => v.status === "ignition_off" || v.status === "ignition_blocked"
  ).length
  const noSignalCount = vehicles.filter((v) => v.status === "no_signal").length

  // Search + filter the data before handing it to the DataTable.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return vehicles.filter((v) => {
      if (statusFilter !== ALL && v.status !== statusFilter) return false
      if (typeFilter !== ALL && v.type !== typeFilter) return false
      if (entityFilter !== ALL && v.entityId !== entityFilter) return false
      if (regionFilter !== ALL && v.region !== regionFilter) return false
      if (gpsFilter !== ALL && v.gpsProvider !== gpsFilter) return false
      if (term !== "") {
        const entityName = entityById.get(v.entityId)?.name ?? ""
        const haystack =
          `${v.plate} ${v.description} ${entityName}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [
    vehicles,
    search,
    statusFilter,
    typeFilter,
    entityFilter,
    regionFilter,
    gpsFilter,
    entityById,
  ])

  const columns: DataTableColumn<Vehicle>[] = [
    {
      key: "plate",
      header: "Plate",
      render: (v) => (
        <div className="min-w-0">
          <div className="font-medium">{v.plate}</div>
          <div className="text-xs text-muted-foreground">
            {VEHICLE_TYPE_LABEL[v.type] ?? v.type}
          </div>
        </div>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (v) => (
        <EntityBadge name={entityById.get(v.entityId)?.shortName ?? "—"} />
      ),
    },
    {
      key: "driver",
      header: "Driver",
      render: (v) => {
        const driver = v.driverId ? driverById.get(v.driverId) : undefined
        return driver ? (
          <span>{fullName(driver)}</span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      render: (v) => <VehicleStatusBadge status={v.status} />,
    },
    {
      key: "speed",
      header: "Speed",
      className: "tabular-nums",
      render: (v) =>
        v.status === "moving" ? (
          formatSpeed(v.speedKmh)
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "lastSync",
      header: "Last sync",
      render: (v) => (
        <RelativeTime iso={v.lastSyncAt} className="text-muted-foreground" />
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (v) => <span className="text-muted-foreground">{v.region}</span>,
    },
  ]

  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: "Status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: VEHICLE_STATUSES.map((s) => ({
        value: s,
        label: VEHICLE_STATUS_CONFIG[s].label,
      })),
    },
    {
      key: "type",
      label: "Type",
      value: typeFilter,
      onChange: setTypeFilter,
      options: VEHICLE_TYPES.map((t) => ({
        value: t,
        label: VEHICLE_TYPE_LABEL[t] ?? t,
      })),
    },
    {
      key: "entity",
      label: "Entity",
      value: entityFilter,
      onChange: setEntityFilter,
      options: entities.map((e) => ({ value: e.id, label: e.shortName })),
    },
    {
      key: "region",
      label: "Region",
      value: regionFilter,
      onChange: setRegionFilter,
      options: ETHIOPIA_REGIONS.map((r) => ({ value: r, label: r })),
    },
    {
      key: "gps",
      label: "GPS",
      value: gpsFilter,
      onChange: setGpsFilter,
      options: GPS_PROVIDERS.map((p) => ({ value: p, label: p })),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Fleet"
        description="Vehicles operated by monitored entities across the corridor."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add vehicle
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total vehicles" value={vehicles.length} icon={Truck} />
        <StatCard
          label="Moving"
          value={movingCount}
          icon={Navigation}
          intent="success"
        />
        <StatCard
          label="Idling"
          value={idlingCount}
          icon={PauseCircle}
          intent="warning"
        />
        <StatCard label="Stopped" value={stoppedCount} icon={PowerOff} />
        <StatCard
          label="No signal"
          value={noSignalCount}
          icon={WifiOff}
          intent="danger"
        />
        <StatCard
          label="Entities monitored"
          value={entities.length}
          icon={Building2}
        />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={vehiclesQuery.isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search plate, model or entity…"
        filters={filters}
        onRowClick={(v) => navigate(`/fleet/${v.id}`)}
        emptyTitle="No vehicles found"
        emptyDescription="Try adjusting your search or filters."
      />

      <VehicleFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
