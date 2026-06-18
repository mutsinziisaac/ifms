import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Bell, Mail, MessageSquareText, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { EventSeverityBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  useDeleteEventRule,
  useEventRules,
  useGeozones,
  useRoutes,
  useSetEventRuleActive,
} from "@/data/hooks"
import type { EventRule } from "@/data/types"

function NotifyIcons({ rule }: { rule: EventRule }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Bell className="size-3.5" />
      {rule.notify.email && <Mail className="size-3.5" />}
      {rule.notify.sms && <MessageSquareText className="size-3.5" />}
    </span>
  )
}

export function EventRulesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const rules = useEventRules().data ?? []
  const geozones = useGeozones().data ?? []
  const routes = useRoutes().data ?? []
  const setActive = useSetEventRuleActive()
  const deleteRule = useDeleteEventRule()

  const [deleteTarget, setDeleteTarget] = useState<EventRule | null>(null)

  const zoneName = useMemo(
    () => new Map(geozones.map((g) => [g.id, g.name])),
    [geozones]
  )
  const routeName = useMemo(
    () => new Map(routes.map((r) => [r.id, r.name])),
    [routes]
  )

  const toggleRule = (rule: EventRule, active: boolean) => {
    setActive.mutate(
      { id: rule.id, active },
      { onError: () => toast.error(t("events.rules.toast.updateError")) }
    )
  }

  const columns: DataTableColumn<EventRule>[] = [
    {
      key: "name",
      header: t("events.rules.columns.name"),
      className: "max-w-[220px]",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{r.name}</p>
          <p className="text-xs text-muted-foreground">
            {t(`enums.eventRuleType.${r.type}`)}
          </p>
        </div>
      ),
    },
    {
      key: "scope",
      header: t("events.rules.columns.scope"),
      render: (r) => (
        <span className="text-sm">
          {r.geozoneId
            ? (zoneName.get(r.geozoneId) ?? "—")
            : r.routeId
              ? (routeName.get(r.routeId) ?? "—")
              : t("events.rules.scopeFleet")}
        </span>
      ),
    },
    {
      key: "vehicles",
      header: t("events.rules.columns.vehicles"),
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.vehicleIds === null
            ? t("events.rules.vehiclesAll")
            : t("events.rules.vehiclesCount", { count: r.vehicleIds.length })}
        </span>
      ),
    },
    {
      key: "threshold",
      header: t("events.rules.columns.threshold"),
      render: (r) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {r.speedLimitKmh !== null
            ? `${r.speedLimitKmh} km/h`
            : r.deviationMeters !== null
              ? `${r.deviationMeters} m`
              : r.thresholdMinutes !== null
                ? `${r.thresholdMinutes} min`
                : "—"}
        </span>
      ),
    },
    {
      key: "severity",
      header: t("events.rules.columns.severity"),
      render: (r) => <EventSeverityBadge severity={r.severity} />,
    },
    {
      key: "notify",
      header: t("events.rules.columns.notify"),
      render: (r) => <NotifyIcons rule={r} />,
    },
    {
      key: "active",
      header: t("events.rules.columns.active"),
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={r.active}
            onCheckedChange={(checked) => toggleRule(r, checked)}
            aria-label={t("events.rules.toggleAria")}
          />
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (r) => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("events.rules.deleteAria")}
          className="text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            setDeleteTarget(r)
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={t("events.rules.title")}
        description={t("events.rules.description")}
        actions={
          <Button onClick={() => navigate("/config/events/new")}>
            <Plus className="size-4" />
            {t("events.rules.newRule")}
          </Button>
        }
      />

      <DataTable
        data={rules}
        columns={columns}
        pageSize={12}
        emptyTitle={t("events.rules.targeted.emptyTitle")}
        emptyDescription={t("events.rules.targeted.emptyDescription")}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("events.rules.deleteTitle")}
        confirmLabel={t("common.delete")}
        destructive
        description={
          deleteTarget
            ? t("events.rules.deleteDescription", { name: deleteTarget.name })
            : ""
        }
        onConfirm={() => {
          if (!deleteTarget) return
          deleteRule.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success(t("events.rules.toast.deleted"))
              setDeleteTarget(null)
            },
            onError: () => toast.error(t("events.rules.toast.deleteError")),
          })
        }}
        isPending={deleteRule.isPending}
      />
    </div>
  )
}
