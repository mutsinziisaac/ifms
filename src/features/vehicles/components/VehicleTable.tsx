import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/common/DataTable"
import { EntityBadge } from "@/components/common/EntityBadge"
import { RelativeTime } from "@/components/common/RelativeTime"
import { VehicleStatusBadge } from "@/components/common/status-badges"
import { useDrivers, useEntities } from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import {
  ETHIOPIA_REGIONS,
  GPS_PROVIDERS,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
} from "@/data/types"
import { fullName, formatSpeed } from "@/lib/format"

const ALL = "all"

export interface VehicleTableProps {
  vehicles: Vehicle[]
  isLoading?: boolean
}

/**
 * Searchable, filterable vehicle table. Owns its own search/filter state and
 * navigates to the vehicle detail page on row click; the caller supplies the
 * vehicle list (Query data on the fleet page, live data on the map page).
 */
export function VehicleTable({ vehicles, isLoading }: VehicleTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const entities = useEntities().data ?? []
  const drivers = useDrivers().data ?? []

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
        const haystack = `${v.plate} ${v.description} ${entityName}`.toLowerCase()
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
      header: t("vehicles.table.plate"),
      render: (v) => (
        <div className="min-w-0">
          <div className="font-medium">{v.plate}</div>
          <div className="text-xs text-muted-foreground">
            {t(`enums.vehicleType.${v.type}`)}
          </div>
        </div>
      ),
    },
    {
      key: "entity",
      header: t("vehicles.table.entity"),
      render: (v) => (
        <EntityBadge name={entityById.get(v.entityId)?.shortName ?? "—"} />
      ),
    },
    {
      key: "driver",
      header: t("vehicles.table.driver"),
      render: (v) => {
        const driver = v.driverId ? driverById.get(v.driverId) : undefined
        return driver ? (
          <span>{fullName(driver)}</span>
        ) : (
          <span className="text-muted-foreground">
            {t("common.unassigned")}
          </span>
        )
      },
    },
    {
      key: "status",
      header: t("vehicles.table.status"),
      render: (v) => <VehicleStatusBadge status={v.status} />,
    },
    {
      key: "speed",
      header: t("vehicles.table.speed"),
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
      header: t("vehicles.table.lastSync"),
      render: (v) => (
        <RelativeTime iso={v.lastSyncAt} className="text-muted-foreground" />
      ),
    },
    {
      key: "region",
      header: t("vehicles.table.region"),
      render: (v) => <span className="text-muted-foreground">{v.region}</span>,
    },
  ]

  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: t("vehicles.filters.status"),
      value: statusFilter,
      onChange: setStatusFilter,
      options: VEHICLE_STATUSES.map((s) => ({
        value: s,
        label: t(`enums.vehicleStatus.${s}`),
      })),
    },
    {
      key: "type",
      label: t("vehicles.filters.type"),
      value: typeFilter,
      onChange: setTypeFilter,
      options: VEHICLE_TYPES.map((vt) => ({
        value: vt,
        label: t(`enums.vehicleType.${vt}`),
      })),
    },
    {
      key: "entity",
      label: t("vehicles.filters.entity"),
      value: entityFilter,
      onChange: setEntityFilter,
      options: entities.map((e) => ({ value: e.id, label: e.shortName })),
    },
    {
      key: "region",
      label: t("vehicles.filters.region"),
      value: regionFilter,
      onChange: setRegionFilter,
      options: ETHIOPIA_REGIONS.map((r) => ({ value: r, label: r })),
    },
    {
      key: "gps",
      label: t("vehicles.filters.gps"),
      value: gpsFilter,
      onChange: setGpsFilter,
      options: GPS_PROVIDERS.map((p) => ({ value: p, label: p })),
    },
  ]

  return (
    <DataTable
      data={filtered}
      columns={columns}
      isLoading={isLoading}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("vehicles.searchPlaceholder")}
      filters={filters}
      onRowClick={(v) => navigate(`/fleet/${v.id}`)}
      emptyTitle={t("vehicles.emptyTitle")}
      emptyDescription={t("vehicles.emptyDescription")}
    />
  )
}
