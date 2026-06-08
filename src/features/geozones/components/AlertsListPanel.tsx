import { useMemo, useState } from "react"
import { BellOff, CheckCheck } from "lucide-react"

import { AlertSeverityBadge } from "@/components/common/status-badges"
import { Button } from "@/components/ui/button"
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/common/DataTable"
import { RelativeTime } from "@/components/common/RelativeTime"
import {
  useAlerts,
  useGeozones,
  useMarkAllAlertsRead,
  useVehicles,
} from "@/data/hooks"
import { ALERT_TYPES } from "@/data/types"
import type { Alert, AlertType } from "@/data/types"
import { ALERT_TYPE_LABEL } from "@/lib/status"
import { cn } from "@/lib/utils"

export function AlertsListPanel() {
  const alertsQuery = useAlerts()
  const vehicles = useVehicles().data ?? []
  const geozones = useGeozones().data ?? []
  const markAllRead = useMarkAllAlertsRead()

  const alerts = alertsQuery.data ?? []

  const [vehicleFilter, setVehicleFilter] = useState("all")
  const [geozoneFilter, setGeozoneFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filtered = useMemo(
    () =>
      alerts.filter((alert) => {
        if (vehicleFilter !== "all" && alert.vehicleId !== vehicleFilter) {
          return false
        }
        if (geozoneFilter !== "all" && alert.geozoneId !== geozoneFilter) {
          return false
        }
        if (typeFilter !== "all" && alert.type !== typeFilter) {
          return false
        }
        return true
      }),
    [alerts, vehicleFilter, geozoneFilter, typeFilter]
  )

  const unreadCount = alerts.filter((alert) => !alert.read).length

  const filters: DataTableFilter[] = [
    {
      key: "vehicle",
      label: "Vehicle",
      value: vehicleFilter,
      onChange: setVehicleFilter,
      options: vehicles.map((v) => ({ value: v.id, label: v.plate })),
    },
    {
      key: "geozone",
      label: "Geozone",
      value: geozoneFilter,
      onChange: setGeozoneFilter,
      options: geozones.map((g) => ({ value: g.id, label: g.name })),
    },
    {
      key: "type",
      label: "Type",
      value: typeFilter,
      onChange: setTypeFilter,
      options: ALERT_TYPES.map((t: AlertType) => ({
        value: t,
        label: ALERT_TYPE_LABEL[t],
      })),
    },
  ]

  const columns: DataTableColumn<Alert>[] = [
    {
      key: "severity",
      header: "Severity",
      className: "w-28",
      render: (alert) => <AlertSeverityBadge severity={alert.severity} />,
    },
    {
      key: "message",
      header: "Event",
      render: (alert) => (
        <div className="flex items-start gap-2">
          {!alert.read ? (
            <span
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          ) : (
            <span className="mt-1.5 size-1.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm",
                alert.read ? "text-muted-foreground" : "font-medium"
              )}
            >
              {alert.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {ALERT_TYPE_LABEL[alert.type]}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "geozone",
      header: "Geozone",
      className: "w-40",
      render: (alert) => (
        <span className="text-sm text-muted-foreground">
          {alert.geozoneName ?? "—"}
        </span>
      ),
    },
    {
      key: "plate",
      header: "Vehicle",
      className: "w-32",
      render: (alert) => (
        <span className="font-mono text-sm tabular-nums">
          {alert.vehiclePlate}
        </span>
      ),
    },
    {
      key: "at",
      header: "When",
      className: "w-32 text-right",
      render: (alert) => (
        <RelativeTime
          iso={alert.at}
          className="text-xs text-muted-foreground"
        />
      ),
    },
  ]

  return (
    <DataTable
      data={filtered}
      columns={columns}
      filters={filters}
      isLoading={alertsQuery.isLoading}
      pageSize={8}
      emptyTitle="No alerts"
      emptyDescription="No alerts match the current filters."
      toolbarActions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
        >
          {unreadCount === 0 ? (
            <BellOff className="size-4" />
          ) : (
            <CheckCheck className="size-4" />
          )}
          Mark all read
        </Button>
      }
    />
  )
}
