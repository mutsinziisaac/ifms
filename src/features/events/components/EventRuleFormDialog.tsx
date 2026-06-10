import { useEffect, useState } from "react"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useGeozones, useUpsertEventRule } from "@/data/hooks"
import { ZONE_RULE_TYPES } from "@/data/types"
import type { EventRule, EventSeverity, ZoneRuleType } from "@/data/types"
import { EVENT_RULE_TYPE_LABEL, EVENT_SEVERITY_CONFIG } from "@/lib/status"

const SEVERITIES: EventSeverity[] = ["info", "warning", "critical"]

export interface EventRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Zone-scoped rule being edited, or undefined to create one. */
  rule?: EventRule
}

export function EventRuleFormDialog({
  open,
  onOpenChange,
  rule,
}: EventRuleFormDialogProps) {
  const geozones = useGeozones().data ?? []
  const upsert = useUpsertEventRule()

  const [type, setType] = useState<ZoneRuleType>("entry")
  const [geozoneId, setGeozoneId] = useState<string>("")
  const [speedLimit, setSpeedLimit] = useState("80")
  const [severity, setSeverity] = useState<EventSeverity>("info")
  const [active, setActive] = useState(true)

  // Sync the form whenever the dialog opens (create vs edit).
  useEffect(() => {
    if (!open) return
    setType((rule?.type as ZoneRuleType) ?? "entry")
    setGeozoneId(rule?.geozoneId ?? "")
    setSpeedLimit(String(rule?.speedLimitKmh ?? 80))
    setSeverity(rule?.severity ?? "info")
    setActive(rule?.active ?? true)
  }, [open, rule])

  const handleSubmit = () => {
    if (!geozoneId) {
      toast.error("Choose a geozone for this rule")
      return
    }
    let speedLimitKmh: number | null = null
    if (type === "speeding") {
      const parsed = Number(speedLimit)
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error("Enter a valid speed limit")
        return
      }
      speedLimitKmh = Math.round(parsed)
    }
    upsert.mutate(
      {
        id: rule?.id,
        type,
        geozoneId,
        speedLimitKmh,
        thresholdMinutes: null,
        severity,
        active,
      },
      {
        onSuccess: () => {
          toast.success(rule ? "Rule updated" : "Rule created")
          onOpenChange(false)
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Could not save rule"
          ),
      }
    )
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={rule ? "Edit geozone rule" : "New geozone rule"}
      description="Generates an event when a vehicle triggers this condition."
      submitLabel={rule ? "Save changes" : "Create rule"}
      onSubmit={handleSubmit}
      isPending={upsert.isPending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rule-type">Trigger</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as ZoneRuleType)}
          >
            <SelectTrigger id="rule-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZONE_RULE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EVENT_RULE_TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rule-zone">Geozone</Label>
          <Select value={geozoneId} onValueChange={setGeozoneId}>
            <SelectTrigger id="rule-zone" className="w-full">
              <SelectValue placeholder="Choose a geozone" />
            </SelectTrigger>
            <SelectContent>
              {geozones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {type === "speeding" ? (
          <div className="space-y-2">
            <Label htmlFor="rule-speed">Speed limit (km/h)</Label>
            <Input
              id="rule-speed"
              inputMode="numeric"
              value={speedLimit}
              onChange={(e) => setSpeedLimit(e.target.value)}
              className="tabular-nums"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="rule-severity">Severity</Label>
          <Select
            value={severity}
            onValueChange={(value) => setSeverity(value as EventSeverity)}
          >
            <SelectTrigger id="rule-severity" className="w-full">
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
      <div className="flex items-center gap-2">
        <Switch id="rule-active" checked={active} onCheckedChange={setActive} />
        <Label htmlFor="rule-active">Rule is active</Label>
      </div>
    </FormDialog>
  )
}
