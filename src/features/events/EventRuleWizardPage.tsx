import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Gauge,
  LogIn,
  LogOut,
  Mail,
  MessageSquareText,
  PauseCircle,
  Power,
  SatelliteDish,
  Waypoints,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"

import { EventSeverityBadge } from "@/components/common/status-badges"
import { VehiclePicker } from "@/components/common/VehiclePicker"
import { PageHeader } from "@/components/layout/PageHeader"
import { FleetMap } from "@/components/map/FleetMap"
import { GeozoneOverlay } from "@/components/map/GeozoneOverlay"
import { RoutePolyline } from "@/components/map/RoutePolyline"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { EventRuleInput } from "@/data/api"
import {
  useEventRules,
  useGeozones,
  useRoutes,
  useUpsertEventRule,
} from "@/data/hooks"
import type {
  EventRule,
  EventRuleNotify,
  EventRuleType,
  EventSeverity,
} from "@/data/types"
import { boundsOf, padBounds } from "@/lib/maps"
import { cn } from "@/lib/utils"

import { WizardSteps } from "./components/WizardSteps"

const LOCATION_TYPES: EventRuleType[] = [
  "entry",
  "exit",
  "speeding",
  "route_deviation",
]
const FLEET_TYPES: EventRuleType[] = ["global_speeding", "idle", "no_signal"]
const SEVERITIES: EventSeverity[] = ["info", "warning", "critical"]

const TYPE_ICON: Record<EventRuleType, LucideIcon> = {
  entry: LogIn,
  exit: LogOut,
  speeding: Gauge,
  route_deviation: Waypoints,
  global_speeding: Zap,
  idle: PauseCircle,
  no_signal: SatelliteDish,
  ignition: Power,
}

type ScopeKind = "zone" | "route" | "fleet"

function scopeKind(type: EventRuleType): ScopeKind {
  if (type === "route_deviation") return "route"
  if (type === "entry" || type === "exit" || type === "speeding") return "zone"
  return "fleet"
}

function toNum(value: string): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

interface Draft {
  name: string
  type: EventRuleType
  geozoneId: string
  routeId: string
  speedLimit: string
  thresholdMinutes: string
  deviationMeters: string
  vehicleScope: "all" | "specific"
  vehicleIds: string[]
  severity: EventSeverity
  notify: EventRuleNotify
  active: boolean
}

const DEFAULT_DRAFT: Draft = {
  name: "",
  type: "speeding",
  geozoneId: "",
  routeId: "",
  speedLimit: "80",
  thresholdMinutes: "30",
  deviationMeters: "800",
  vehicleScope: "all",
  vehicleIds: [],
  severity: "warning",
  notify: { email: false, emailTo: "", sms: false, smsTo: "" },
  active: true,
}

function draftFromRule(r: EventRule): Draft {
  return {
    name: r.name,
    type: r.type,
    geozoneId: r.geozoneId ?? "",
    routeId: r.routeId ?? "",
    speedLimit: r.speedLimitKmh !== null ? String(r.speedLimitKmh) : "80",
    thresholdMinutes:
      r.thresholdMinutes !== null ? String(r.thresholdMinutes) : "30",
    deviationMeters: r.deviationMeters !== null ? String(r.deviationMeters) : "800",
    vehicleScope: r.vehicleIds === null ? "all" : "specific",
    vehicleIds: r.vehicleIds ?? [],
    severity: r.severity,
    notify: { ...r.notify },
    active: r.active,
  }
}

function TriggerCard({
  type,
  selected,
  onSelect,
}: {
  type: EventRuleType
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const Icon = TYPE_ICON[type]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/50",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border"
      )}
    >
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {t(`enums.eventRuleType.${type}`)}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {t(`events.rules.wizard.triggerDescriptions.${type}`)}
        </p>
      </div>
    </button>
  )
}

export function EventRuleWizardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = id !== undefined

  const rulesQuery = useEventRules()
  const rules = rulesQuery.data ?? []
  const geozones = useGeozones().data ?? []
  const routes = useRoutes().data ?? []
  const upsert = useUpsertEventRule()

  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT)
  const hydratedRef = useRef(false)

  // Hydrate the form from the rule being edited, once it has loaded.
  useEffect(() => {
    if (!isEdit || hydratedRef.current) return
    const rule = rules.find((r) => r.id === id)
    if (!rule) return
    setDraft(draftFromRule(rule))
    hydratedRef.current = true
  }, [isEdit, id, rules])

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))
  const setNotify = (patch: Partial<EventRuleNotify>) =>
    setDraft((d) => ({ ...d, notify: { ...d.notify, ...patch } }))

  const kind = scopeKind(draft.type)

  const previewBounds = useMemo(() => {
    if (kind === "zone" && draft.geozoneId) {
      const zone = geozones.find((g) => g.id === draft.geozoneId)
      const b = zone ? boundsOf(zone.path ?? [zone.center]) : null
      return b ? padBounds(b, 0.4) : null
    }
    if (kind === "route" && draft.routeId) {
      const route = routes.find((r) => r.id === draft.routeId)
      const b = route ? boundsOf(route.path) : null
      return b ? padBounds(b) : null
    }
    return null
  }, [kind, draft.geozoneId, draft.routeId, geozones, routes])

  const selectedZone = geozones.find((g) => g.id === draft.geozoneId)
  const selectedRoute = routes.find((r) => r.id === draft.routeId)

  const steps = [
    t("events.rules.wizard.steps.trigger"),
    t("events.rules.wizard.steps.where"),
    t("events.rules.wizard.steps.vehicles"),
    t("events.rules.wizard.steps.action"),
  ]

  const stepValid = (s: number): boolean => {
    if (s === 0) return draft.name.trim().length > 0
    if (s === 1) {
      if (kind === "zone") {
        if (!draft.geozoneId) return false
        return draft.type !== "speeding" || toNum(draft.speedLimit) !== null
      }
      if (kind === "route") {
        return !!draft.routeId && toNum(draft.deviationMeters) !== null
      }
      if (draft.type === "global_speeding") return toNum(draft.speedLimit) !== null
      return toNum(draft.thresholdMinutes) !== null
    }
    if (s === 2) return draft.vehicleScope === "all" || draft.vehicleIds.length > 0
    return true
  }

  const handleSave = () => {
    const input: EventRuleInput = {
      id,
      name: draft.name.trim(),
      type: draft.type,
      geozoneId: kind === "zone" ? draft.geozoneId : null,
      routeId: kind === "route" ? draft.routeId : null,
      speedLimitKmh:
        draft.type === "speeding" || draft.type === "global_speeding"
          ? toNum(draft.speedLimit)
          : null,
      thresholdMinutes:
        draft.type === "idle" || draft.type === "no_signal"
          ? toNum(draft.thresholdMinutes)
          : null,
      deviationMeters:
        draft.type === "route_deviation" ? toNum(draft.deviationMeters) : null,
      vehicleIds: draft.vehicleScope === "specific" ? draft.vehicleIds : null,
      severity: draft.severity,
      notify: draft.notify,
      active: draft.active,
    }
    upsert.mutate(input, {
      onSuccess: () => {
        toast.success(
          isEdit
            ? t("events.rules.toast.updated")
            : t("events.rules.toast.created")
        )
        navigate("/config/events")
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : t("events.rules.toast.saveError")
        ),
    })
  }

  // Editing a rule that no longer exists.
  if (isEdit && !rulesQuery.isLoading && !rules.some((r) => r.id === id)) {
    return (
      <div>
        <PageHeader title={t("events.rules.wizard.editTitle")} />
        <Card className="p-6 text-sm text-muted-foreground">
          {t("events.rules.toast.notFound")}
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/config/events")}>
              <ArrowLeft className="size-4" />
              {t("common.back")}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={
          isEdit
            ? t("events.rules.wizard.editTitle")
            : t("events.rules.wizard.createTitle")
        }
        description={
          isEdit
            ? t("events.rules.wizard.editDescription")
            : t("events.rules.wizard.createDescription")
        }
        actions={
          <Button variant="ghost" onClick={() => navigate("/config/events")}>
            {t("events.rules.wizard.cancel")}
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden p-0">
        <div className="border-b bg-muted/30 px-6 py-4">
          <WizardSteps steps={steps} current={step} />
        </div>

        <div className="min-h-[20rem] p-6">
          {/* Step 1 — trigger type + name */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-base font-semibold">
                  {t("events.rules.wizard.step1.title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("events.rules.wizard.step1.description")}
                </p>
              </div>

              <div className="max-w-md space-y-2">
                <Label htmlFor="rule-name">
                  {t("events.rules.wizard.step1.nameLabel")}
                </Label>
                <Input
                  id="rule-name"
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder={t("events.rules.wizard.step1.namePlaceholder")}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t("events.rules.wizard.step1.locationGroup")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {LOCATION_TYPES.map((type) => (
                    <TriggerCard
                      key={type}
                      type={type}
                      selected={draft.type === type}
                      onSelect={() => set({ type })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {t("events.rules.wizard.step1.fleetGroup")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {FLEET_TYPES.map((type) => (
                    <TriggerCard
                      key={type}
                      type={type}
                      selected={draft.type === type}
                      onSelect={() => set({ type })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — where / thresholds */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-base font-semibold">
                  {t("events.rules.wizard.step2.title")}
                </h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-4">
                  {kind === "zone" && (
                    <div className="space-y-2">
                      <Label htmlFor="rule-zone">
                        {t("events.rules.wizard.step2.geozoneLabel")}
                      </Label>
                      <Select
                        value={draft.geozoneId}
                        onValueChange={(v) => set({ geozoneId: v })}
                      >
                        <SelectTrigger id="rule-zone" className="w-full">
                          <SelectValue
                            placeholder={t(
                              "events.rules.wizard.step2.geozonePlaceholder"
                            )}
                          />
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
                  )}

                  {draft.type === "speeding" && (
                    <div className="space-y-2">
                      <Label htmlFor="rule-speed">
                        {t("events.rules.wizard.step2.speedLimitLabel")}
                      </Label>
                      <Input
                        id="rule-speed"
                        inputMode="numeric"
                        value={draft.speedLimit}
                        onChange={(e) => set({ speedLimit: e.target.value })}
                        className="tabular-nums"
                      />
                    </div>
                  )}

                  {kind === "route" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="rule-route">
                          {t("events.rules.wizard.step2.routeLabel")}
                        </Label>
                        <Select
                          value={draft.routeId}
                          onValueChange={(v) => set({ routeId: v })}
                        >
                          <SelectTrigger id="rule-route" className="w-full">
                            <SelectValue
                              placeholder={t(
                                "events.rules.wizard.step2.routePlaceholder"
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {routes.map((route) => (
                              <SelectItem key={route.id} value={route.id}>
                                {route.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rule-deviation">
                          {t("events.rules.wizard.step2.deviationLabel")}
                        </Label>
                        <Input
                          id="rule-deviation"
                          inputMode="numeric"
                          value={draft.deviationMeters}
                          onChange={(e) =>
                            set({ deviationMeters: e.target.value })
                          }
                          className="tabular-nums"
                        />
                      </div>
                    </>
                  )}

                  {draft.type === "global_speeding" && (
                    <div className="space-y-2">
                      <Label htmlFor="rule-fleet-speed">
                        {t("events.rules.wizard.step2.fleetSpeedLabel")}
                      </Label>
                      <Input
                        id="rule-fleet-speed"
                        inputMode="numeric"
                        value={draft.speedLimit}
                        onChange={(e) => set({ speedLimit: e.target.value })}
                        className="tabular-nums"
                      />
                    </div>
                  )}

                  {draft.type === "idle" && (
                    <div className="space-y-2">
                      <Label htmlFor="rule-idle">
                        {t("events.rules.wizard.step2.idleLabel")}
                      </Label>
                      <Input
                        id="rule-idle"
                        inputMode="numeric"
                        value={draft.thresholdMinutes}
                        onChange={(e) =>
                          set({ thresholdMinutes: e.target.value })
                        }
                        className="tabular-nums"
                      />
                    </div>
                  )}

                  {draft.type === "no_signal" && (
                    <div className="space-y-2">
                      <Label htmlFor="rule-nosignal">
                        {t("events.rules.wizard.step2.noSignalLabel")}
                      </Label>
                      <Input
                        id="rule-nosignal"
                        inputMode="numeric"
                        value={draft.thresholdMinutes}
                        onChange={(e) =>
                          set({ thresholdMinutes: e.target.value })
                        }
                        className="tabular-nums"
                      />
                    </div>
                  )}

                  {kind === "fleet" && (
                    <p className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                      {t("events.rules.wizard.step2.fleetNote")}
                    </p>
                  )}
                </div>

                {/* Map preview */}
                {kind !== "fleet" && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t("events.rules.wizard.step2.previewTitle")}
                    </p>
                    <div className="h-64 overflow-hidden rounded-xl border">
                      {previewBounds ? (
                        <FleetMap
                          bounds={previewBounds}
                          className="h-full w-full rounded-none"
                        >
                          {kind === "zone" && selectedZone && (
                            <GeozoneOverlay zone={selectedZone} selected />
                          )}
                          {kind === "route" &&
                            selectedRoute &&
                            selectedRoute.path.length >= 2 && (
                              <RoutePolyline
                                path={selectedRoute.path}
                                selected
                                active={selectedRoute.active}
                                waypoints={selectedRoute.waypoints}
                                showWaypoints
                              />
                            )}
                        </FleetMap>
                      ) : (
                        <div className="grid h-full place-items-center p-4 text-center text-xs text-muted-foreground">
                          {t("events.rules.wizard.step2.previewEmpty")}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — vehicles */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-base font-semibold">
                  {t("events.rules.wizard.step3.title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("events.rules.wizard.step3.description")}
                </p>
              </div>

              <RadioGroup
                value={draft.vehicleScope}
                onValueChange={(v) =>
                  set({ vehicleScope: v as Draft["vehicleScope"] })
                }
                className="grid gap-3 sm:grid-cols-2"
              >
                {(["all", "specific"] as const).map((scope) => (
                  <label
                    key={scope}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:border-primary/50",
                      draft.vehicleScope === scope
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border"
                    )}
                  >
                    <RadioGroupItem value={scope} className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        {t(`events.rules.wizard.step3.${scope}Label`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`events.rules.wizard.step3.${scope}Hint`)}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              {draft.vehicleScope === "specific" && (
                <VehiclePicker
                  selected={draft.vehicleIds}
                  onChange={(ids) => set({ vehicleIds: ids })}
                />
              )}
            </div>
          )}

          {/* Step 4 — action & review */}
          {step === 3 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <h2 className="font-heading text-base font-semibold">
                    {t("events.rules.wizard.step4.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("events.rules.wizard.step4.description")}
                  </p>
                </div>

                <div className="max-w-xs space-y-2">
                  <Label htmlFor="rule-severity">
                    {t("events.rules.wizard.step4.severityLabel")}
                  </Label>
                  <Select
                    value={draft.severity}
                    onValueChange={(v) => set({ severity: v as EventSeverity })}
                  >
                    <SelectTrigger id="rule-severity" className="w-full">
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

                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    {t("events.rules.wizard.step4.notifyTitle")}
                  </p>

                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                    <Bell className="size-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {t("events.rules.wizard.step4.inApp")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("events.rules.wizard.step4.inAppHint")}
                      </p>
                    </div>
                    <Switch checked disabled aria-readonly />
                  </div>

                  <div className="rounded-lg border px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <Mail className="size-4 text-muted-foreground" />
                      <span className="flex-1 text-sm font-medium">
                        {t("events.rules.wizard.step4.email")}
                      </span>
                      <Switch
                        checked={draft.notify.email}
                        onCheckedChange={(c) => setNotify({ email: c })}
                      />
                    </div>
                    {draft.notify.email && (
                      <Input
                        value={draft.notify.emailTo}
                        onChange={(e) => setNotify({ emailTo: e.target.value })}
                        placeholder={t("events.rules.wizard.step4.emailPlaceholder")}
                        className="mt-2"
                        autoComplete="off"
                      />
                    )}
                  </div>

                  <div className="rounded-lg border px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <MessageSquareText className="size-4 text-muted-foreground" />
                      <span className="flex-1 text-sm font-medium">
                        {t("events.rules.wizard.step4.sms")}
                      </span>
                      <Switch
                        checked={draft.notify.sms}
                        onCheckedChange={(c) => setNotify({ sms: c })}
                      />
                    </div>
                    {draft.notify.sms && (
                      <Input
                        value={draft.notify.smsTo}
                        onChange={(e) => setNotify({ smsTo: e.target.value })}
                        placeholder={t("events.rules.wizard.step4.smsPlaceholder")}
                        className="mt-2"
                        autoComplete="off"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Review */}
              <Card className="h-fit gap-0 bg-muted/20 p-5">
                <p className="font-heading text-sm font-semibold">
                  {t("events.rules.wizard.step4.reviewTitle")}
                </p>
                <dl className="mt-3 space-y-2.5 text-sm">
                  <ReviewRow label={t("events.rules.wizard.step4.reviewType")}>
                    {t(`enums.eventRuleType.${draft.type}`)}
                  </ReviewRow>
                  <ReviewRow label={t("events.rules.wizard.step4.reviewScope")}>
                    {kind === "zone"
                      ? (selectedZone?.name ?? "—")
                      : kind === "route"
                        ? (selectedRoute?.name ?? "—")
                        : t("events.rules.scopeFleet")}
                  </ReviewRow>
                  <ReviewRow
                    label={t("events.rules.wizard.step4.reviewVehicles")}
                  >
                    {draft.vehicleScope === "all"
                      ? t("events.rules.vehiclesAll")
                      : t("events.rules.vehiclesCount", {
                          count: draft.vehicleIds.length,
                        })}
                  </ReviewRow>
                  <ReviewRow
                    label={t("events.rules.wizard.step4.reviewSeverity")}
                  >
                    <EventSeverityBadge severity={draft.severity} />
                  </ReviewRow>
                  <ReviewRow label={t("events.rules.wizard.step4.reviewNotify")}>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Bell className="size-3.5" />
                      {draft.notify.email && <Mail className="size-3.5" />}
                      {draft.notify.sms && (
                        <MessageSquareText className="size-3.5" />
                      )}
                    </span>
                  </ReviewRow>
                </dl>
              </Card>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="size-4" />
            {t("events.rules.wizard.back")}
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!stepValid(step)}
            >
              {t("events.rules.wizard.next")}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!stepValid(0) || !stepValid(1) || upsert.isPending}
            >
              {isEdit
                ? t("events.rules.wizard.saveChanges")
                : t("events.rules.wizard.save")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function ReviewRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}
