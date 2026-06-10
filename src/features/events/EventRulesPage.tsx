import { useMemo, useState } from "react"
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
import { EVENT_RULE_TYPE_LABEL, EVENT_SEVERITY_CONFIG } from "@/lib/status"
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
    description: string
    unit: string
    defaultThreshold: number
    defaultSeverity: EventSeverity
  }
> = {
  global_speeding: {
    icon: Gauge,
    description:
      "Fires a speeding event when any vehicle exceeds this limit anywhere on the corridor.",
    unit: "km/h",
    defaultThreshold: 100,
    defaultSeverity: "warning",
  },
  idle: {
    icon: PauseCircle,
    description:
      "Fires when a vehicle keeps its engine running while stationary beyond this duration.",
    unit: "min",
    defaultThreshold: 45,
    defaultSeverity: "info",
  },
  no_signal: {
    icon: SatelliteDish,
    description:
      "Fires when a device stops transmitting for longer than this window.",
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
        onError: () => toast.error("Could not update rule"),
      }
    )
  }

  const commitThreshold = () => {
    const parsed = Number(thresholdDraft)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter a valid threshold")
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
              {EVENT_RULE_TYPE_LABEL[type]}
            </p>
            <p className="text-xs text-muted-foreground">
              {active ? "Active" : "Inactive"}
            </p>
          </div>
        </div>
        <Switch
          checked={active}
          onCheckedChange={(checked) => save({ active: checked })}
          aria-label={`Toggle ${EVENT_RULE_TYPE_LABEL[type]} rule`}
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {meta.description}
      </p>
      <div className="mt-4 flex items-end gap-3">
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Threshold ({meta.unit})
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
            Severity
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
                  {EVENT_SEVERITY_CONFIG[s].label}
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
      { onError: () => toast.error("Could not update rule") }
    )
  }

  const columns: DataTableColumn<EventRule>[] = [
    {
      key: "zone",
      header: "Geozone",
      render: (r) => (
        <span className="text-sm font-medium">
          {(r.geozoneId && zoneName.get(r.geozoneId)) ?? "—"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Trigger",
      render: (r) => (
        <span className="text-sm">{EVENT_RULE_TYPE_LABEL[r.type]}</span>
      ),
    },
    {
      key: "threshold",
      header: "Threshold",
      render: (r) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {r.speedLimitKmh !== null ? `${r.speedLimitKmh} km/h` : "—"}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (r) => <EventSeverityBadge severity={r.severity} />,
    },
    {
      key: "active",
      header: "Active",
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={r.active}
            onCheckedChange={(checked) => toggleZoneRule(r, checked)}
            aria-label="Toggle rule"
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
          aria-label="Delete rule"
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
        title="Event Rules"
        description="Violation rules that generate events across the monitored fleet."
        actions={
          <Button
            onClick={() => {
              setEditRule(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="size-4" />
            New geozone rule
          </Button>
        }
      />

      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-base font-semibold">
              Fleet-wide rules
            </h2>
            <p className="text-sm text-muted-foreground">
              Apply to every monitored vehicle, independent of geozones.
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
              Geozone rules
            </h2>
            <p className="text-sm text-muted-foreground">
              Entry, exit and zone speed rules — also editable per zone on the
              Geozones page.
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
            emptyTitle="No geozone rules"
            emptyDescription="Create a rule to start generating geozone events."
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
        title="Delete rule?"
        confirmLabel="Delete"
        destructive
        description={
          deleteTarget
            ? `The ${EVENT_RULE_TYPE_LABEL[deleteTarget.type]} rule for ${
                (deleteTarget.geozoneId &&
                  zoneName.get(deleteTarget.geozoneId)) ??
                "this zone"
              } will stop generating events.`
            : ""
        }
        onConfirm={() => {
          if (!deleteTarget) return
          deleteRule.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Rule deleted")
              setDeleteTarget(null)
            },
            onError: () => toast.error("Could not delete rule"),
          })
        }}
        isPending={deleteRule.isPending}
      />
    </div>
  )
}
