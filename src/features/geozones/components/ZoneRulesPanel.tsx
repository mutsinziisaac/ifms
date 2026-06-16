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
import { useTranslation } from "react-i18next"
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

const RULE_ICON: Record<ZoneRuleType, LucideIcon> = {
  entry: ArrowRightToLine,
  exit: ArrowRightFromLine,
  speeding: Gauge,
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
  const { t } = useTranslation()
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
        onError: () => toast.error(t("geozones.toast.ruleUpdateFailed")),
      }
    )
  }

  const removeRule = (rule: EventRule) => {
    deleteRule.mutate(rule.id, {
      onSuccess: () => toast.success(t("geozones.toast.ruleRemoved")),
      onError: () => toast.error(t("geozones.toast.ruleRemoveFailed")),
    })
  }

  const addRule = () => {
    let speedLimitKmh: number | null = null
    if (newType === "speeding") {
      const parsed = Number(newSpeed)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error(t("geozones.toast.invalidSpeedLimit"))
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
          toast.success(t("geozones.toast.ruleAdded"))
          setNewType("entry")
          setNewSpeed("60")
        },
        onError: () => toast.error(t("geozones.toast.ruleAddFailed")),
      }
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold">
          {t("geozones.rules.title")}
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("geozones.rules.count", { count: rules.length })}
        </span>
      </div>

      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            {t("geozones.rules.empty")}
          </p>
        ) : (
          rules.map((rule) => {
            const ruleType = rule.type as ZoneRuleType
            const Icon = RULE_ICON[ruleType]
            const label = t(`enums.eventRuleType.${ruleType}`)
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
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.type === "speeding" && rule.speedLimitKmh != null
                      ? t("geozones.rules.overSpeed", {
                          speed: rule.speedLimitKmh,
                        })
                      : t(`geozones.rules.description.${ruleType}`)}
                  </p>
                </div>
                <Switch
                  checked={rule.active}
                  onCheckedChange={(checked) => toggleActive(rule, checked)}
                  aria-label={t("geozones.rules.toggleRule", { type: label })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeRule(rule)}
                  aria-label={t("geozones.rules.deleteRule")}
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
            {t("geozones.rules.addRule")}
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
                  {t(`enums.eventRuleType.${type}`)}
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
          {t("common.add")}
        </Button>
      </div>

      <Link
        to="/config/events"
        className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
      >
        {t("geozones.rules.allRules")}
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  )
}
