import { useState } from "react"
import {
  ArrowRightFromLine,
  ArrowRightToLine,
  ArrowUpRight,
  Gauge,
  Plus,
  Trash2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  useUpsertEventRule,
} from "@/data/hooks"
import { ZONE_RULE_TYPES } from "@/data/types"
import type {
  EventRule,
  EventSeverity,
  Geozone,
  ZoneRuleType,
} from "@/data/types"
import { cn } from "@/lib/utils"

const RULE_META: Record<
  ZoneRuleType,
  { label: string; icon: LucideIcon; description: string }
> = {
  entry: {
    label: "Entry",
    icon: ArrowRightToLine,
    description: "Vehicle enters this zone",
  },
  exit: {
    label: "Exit",
    icon: ArrowRightFromLine,
    description: "Vehicle leaves this zone",
  },
  speeding: {
    label: "Speeding",
    icon: Gauge,
    description: "Speed exceeds the limit inside this zone",
  },
}

const DEFAULT_SEVERITY: Record<ZoneRuleType, EventSeverity> = {
  entry: "info",
  exit: "info",
  speeding: "warning",
}

export interface ZoneRulesPanelProps {
  geozone: Geozone
}

export function ZoneRulesPanel({ geozone }: ZoneRulesPanelProps) {
  const rules = (useEventRules().data ?? []).filter(
    (rule) => rule.geozoneId === geozone.id
  )

  const upsertRule = useUpsertEventRule()
  const deleteRule = useDeleteEventRule()

  const [newType, setNewType] = useState<ZoneRuleType>("entry")
  const [newSpeed, setNewSpeed] = useState("60")

  const toggleActive = (rule: EventRule, active: boolean) => {
    upsertRule.mutate(
      {
        id: rule.id,
        geozoneId: rule.geozoneId,
        type: rule.type,
        speedLimitKmh: rule.speedLimitKmh,
        thresholdMinutes: rule.thresholdMinutes,
        severity: rule.severity,
        active,
      },
      {
        onError: () => toast.error("Could not update rule"),
      }
    )
  }

  const removeRule = (rule: EventRule) => {
    deleteRule.mutate(rule.id, {
      onSuccess: () => toast.success("Rule removed"),
      onError: () => toast.error("Could not remove rule"),
    })
  }

  const addRule = () => {
    let speedLimitKmh: number | null = null
    if (newType === "speeding") {
      const parsed = Number(newSpeed)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error("Enter a valid speed limit")
        return
      }
      speedLimitKmh = Math.round(parsed)
    }
    upsertRule.mutate(
      {
        geozoneId: geozone.id,
        type: newType,
        speedLimitKmh,
        thresholdMinutes: null,
        severity: DEFAULT_SEVERITY[newType],
        active: true,
      },
      {
        onSuccess: () => {
          toast.success("Event rule added")
          setNewType("entry")
          setNewSpeed("60")
        },
        onError: () => toast.error("Could not add rule"),
      }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold">Event rules</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {rules.length} rule{rules.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            No event rules yet for this zone.
          </p>
        ) : (
          rules.map((rule) => {
            const meta = RULE_META[rule.type as ZoneRuleType]
            const Icon = meta.icon
            return (
              <div
                key={rule.id}
                className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    rule.active ? "text-foreground" : "text-muted-foreground/60"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.type === "speeding" && rule.speedLimitKmh != null
                      ? `Over ${rule.speedLimitKmh} km/h`
                      : meta.description}
                  </p>
                </div>
                <Switch
                  checked={rule.active}
                  onCheckedChange={(checked) => toggleActive(rule, checked)}
                  aria-label={`Toggle ${meta.label} rule`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRule(rule)}
                  aria-label="Delete rule"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )
          })
        )}
      </div>

      <div className="flex items-end gap-2 rounded-lg border bg-muted/30 p-2.5">
        <div className="flex-1 space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Add rule
          </span>
          <Select
            value={newType}
            onValueChange={(value) => setNewType(value as ZoneRuleType)}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZONE_RULE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {RULE_META[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {newType === "speeding" ? (
          <div className="w-20 space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              km/h
            </span>
            <Input
              inputMode="numeric"
              value={newSpeed}
              onChange={(e) => setNewSpeed(e.target.value)}
              className="h-8 tabular-nums"
            />
          </div>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={addRule}
          disabled={upsertRule.isPending}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <Link
        to="/config/events"
        className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
      >
        All event rules
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  )
}
