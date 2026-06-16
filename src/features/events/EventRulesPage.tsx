import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Gauge, PauseCircle, Plus, SatelliteDish, Trash2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { EventSeverityBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  useDeleteEventRule,
  useEventRules,
  useGeozones,
  useUpsertEventRule,
} from "@/data/hooks"
import type { EventRule, EventRuleType, EventSeverity } from "@/data/types"
import { cn } from "@/lib/utils"

import { EventRuleFormDialog } from "./components/EventRuleFormDialog"

const SEVERITIES: EventSeverity[] = ["info", "warning", "critical"]

type GlobalRuleType = Extract<
  EventRuleType,
  "global_speeding" | "idle" | "no_signal"
>

const GLOBAL_RULE_META: Record<
  GlobalRuleType,
  {
    icon: LucideIcon
    unit: string
    defaultThreshold: number
    defaultSeverity: EventSeverity
  }
> = {
  global_speeding: {
    icon: Gauge,
    unit: "km/h",
    defaultThreshold: 100,
    defaultSeverity: "warning",
  },
  idle: {
    icon: PauseCircle,
    unit: "min",
    defaultThreshold: 45,
    defaultSeverity: "info",
  },
  no_signal: {
    icon: SatelliteDish,
    unit: "min",
    defaultThreshold: 30,
    defaultSeverity: "warning",
  },
}

function GlobalRuleCard({
  type,
  rule,
}: {
  type: GlobalRuleType
  rule: EventRule | undefined
}) {
  const { t } = useTranslation()
  const meta = GLOBAL_RULE_META[type]
  const Icon = meta.icon
  const upsert = useUpsertEventRule()

  const threshold =
    (type === "global_speeding"
      ? rule?.speedLimitKmh
      : rule?.thresholdMinutes) ?? meta.defaultThreshold
  const severity = rule?.severity ?? meta.defaultSeverity
  const active = rule?.active ?? false

  const [thresholdDraft, setThresholdDraft] = useState(String(threshold))

  const save = (patch: {
    threshold?: number
    severity?: EventSeverity
    active?: boolean
  }) => {
    const nextThreshold = patch.threshold ?? threshold
    upsert.mutate(
      {
        id: rule?.id,
        type,
        geozoneId: null,
        speedLimitKmh: type === "global_speeding" ? nextThreshold : null,
        thresholdMinutes: type === "global_speeding" ? null : nextThreshold,
        severity: patch.severity ?? severity,
        active: patch.active ?? active,
      },
      {
        onError: () => toast.error(t("events.rules.toast.updateError")),
      }
    )
  }

  const commitThreshold = () => {
    const parsed = Number(thresholdDraft)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error(t("events.rules.toast.invalidThreshold"))
      setThresholdDraft(String(threshold))
      return
    }
    const next = Math.round(parsed)
    if (next !== threshold) save({ threshold: next })
  }

  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "grid size-9 place-items-center rounded-lg",
              active
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="size-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {t(`enums.eventRuleType.${type}`)}
            </p>
            <p className="text-xs text-muted-foreground">
              {active
                ? t("events.rules.fleetWide.active")
                : t("events.rules.fleetWide.inactive")}
            </p>
          </div>
        </div>
        <Switch
          checked={active}
          onCheckedChange={(checked) => save({ active: checked })}
          aria-label={t("events.rules.fleetWide.toggleAria", {
            name: t(`enums.eventRuleType.${type}`),
          })}
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {t(`events.rules.descriptions.${type}`)}
      </p>
      <div className="mt-4 flex items-end gap-3">
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t("events.rules.fleetWide.thresholdLabel", { unit: meta.unit })}
          </span>
          <Input
            inputMode="numeric"
            value={thresholdDraft}
            onChange={(e) => setThresholdDraft(e.target.value)}
            onBlur={commitThreshold}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
            }}
            className="h-8 w-24 tabular-nums"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t("forms.severity")}
          </span>
          <Select
            value={severity}
            onValueChange={(value) =>
              save({ severity: value as EventSeverity })
            }
          >
            <SelectTrigger size="sm" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`enums.eventSeverity.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  )
}

export function EventRulesPage() {
  const { t } = useTranslation()
  const rules = useEventRules().data ?? []
  const geozones = useGeozones().data ?? []
  const upsert = useUpsertEventRule()
  const deleteRule = useDeleteEventRule()

  const [formOpen, setFormOpen] = useState(false)
  const [editRule, setEditRule] = useState<EventRule | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<EventRule | null>(null)

  const zoneName = useMemo(
    () => new Map(geozones.map((g) => [g.id, g.name])),
    [geozones]
  )

  const globalRule = (type: GlobalRuleType) =>
    rules.find((r) => r.type === type)

  const zoneRules = rules.filter((r) => r.geozoneId !== null)

  const toggleZoneRule = (rule: EventRule, active: boolean) => {
    upsert.mutate(
      {
        id: rule.id,
        type: rule.type,
        geozoneId: rule.geozoneId,
        speedLimitKmh: rule.speedLimitKmh,
        thresholdMinutes: rule.thresholdMinutes,
        severity: rule.severity,
        active,
      },
      { onError: () => toast.error(t("events.rules.toast.updateError")) }
    )
  }

  const columns: DataTableColumn<EventRule>[] = [
    {
      key: "zone",
      header: t("events.rules.columns.geozone"),
      render: (r) => (
        <span className="text-sm font-medium">
          {(r.geozoneId && zoneName.get(r.geozoneId)) ?? "—"}
        </span>
      ),
    },
    {
      key: "type",
      header: t("events.rules.columns.trigger"),
      render: (r) => (
        <span className="text-sm">{t(`enums.eventRuleType.${r.type}`)}</span>
      ),
    },
    {
      key: "threshold",
      header: t("events.rules.columns.threshold"),
      render: (r) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {r.speedLimitKmh !== null ? `${r.speedLimitKmh} km/h` : "—"}
        </span>
      ),
    },
    {
      key: "severity",
      header: t("events.rules.columns.severity"),
      render: (r) => <EventSeverityBadge severity={r.severity} />,
    },
    {
      key: "active",
      header: t("events.rules.columns.active"),
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={r.active}
            onCheckedChange={(checked) => toggleZoneRule(r, checked)}
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
          <Button
            onClick={() => {
              setEditRule(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" />
            {t("events.rules.newGeozoneRule")}
          </Button>
        }
      />

      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-base font-semibold">
              {t("events.rules.fleetWide.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("events.rules.fleetWide.description")}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <GlobalRuleCard
              type="global_speeding"
              rule={globalRule("global_speeding")}
            />
            <GlobalRuleCard type="idle" rule={globalRule("idle")} />
            <GlobalRuleCard type="no_signal" rule={globalRule("no_signal")} />
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-base font-semibold">
              {t("events.rules.geozone.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("events.rules.geozone.description")}
            </p>
          </div>
          <DataTable
            data={zoneRules}
            columns={columns}
            onRowClick={(rule) => {
              setEditRule(rule)
              setFormOpen(true)
            }}
            pageSize={10}
            emptyTitle={t("events.rules.geozone.emptyTitle")}
            emptyDescription={t("events.rules.geozone.emptyDescription")}
          />
        </section>
      </div>

      <EventRuleFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditRule(undefined)
        }}
        rule={editRule}
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
            ? t("events.rules.deleteDescription", {
                type: t(`enums.eventRuleType.${deleteTarget.type}`),
                zone:
                  (deleteTarget.geozoneId &&
                    zoneName.get(deleteTarget.geozoneId)) ||
                  t("events.rules.deleteFallbackZone"),
              })
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
