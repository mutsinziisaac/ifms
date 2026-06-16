import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Gauge, Truck, Wind, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useVehicles } from "@/data/hooks"
import type { Driver } from "@/data/types"
import type { TranslationKey } from "@/i18n"
import { cn } from "@/lib/utils"

interface ScoreTone {
  /** Translation key for the qualitative band label. */
  labelKey: TranslationKey
  text: string
  ring: string
  track: string
}

function scoreTone(score: number): ScoreTone {
  if (score >= 85) {
    return {
      labelKey: "drivers.detail.safety.excellent",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "text-emerald-500",
      track: "text-emerald-500/15",
    }
  }
  if (score >= 70) {
    return {
      labelKey: "drivers.detail.safety.fair",
      text: "text-amber-600 dark:text-amber-400",
      ring: "text-amber-500",
      track: "text-amber-500/15",
    }
  }
  return {
    labelKey: "drivers.detail.safety.needsAttention",
    text: "text-rose-600 dark:text-rose-400",
    ring: "text-rose-500",
    track: "text-rose-500/15",
  }
}

interface MetricRowProps {
  icon: LucideIcon
  label: string
  count: number
  /** Reference ceiling used to scale the bar to a sensible width. */
  ceiling: number
  barClass: string
}

function MetricRow({
  icon: Icon,
  label,
  count,
  ceiling,
  barClass,
}: MetricRowProps) {
  const pct =
    ceiling > 0 ? Math.min(100, Math.round((count / ceiling) * 100)) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Icon className="size-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className="text-sm font-medium tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barClass)}
          style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
        />
      </div>
    </div>
  )
}

export function DriverSafetyPanel({ driver }: { driver: Driver }) {
  const { t } = useTranslation()
  const vehicles = useVehicles().data ?? []
  const assignedVehicle = driver.assignedVehicleId
    ? (vehicles.find((v) => v.id === driver.assignedVehicleId) ?? null)
    : null

  const score = Math.round(driver.safetyScore)
  const tone = scoreTone(score)

  // Radial gauge geometry.
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dash = (score / 100) * circumference

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="size-5 text-primary" />
          {t("drivers.detail.safety.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center gap-3 py-2">
          <div className="relative grid size-36 place-items-center">
            <svg
              viewBox="0 0 120 120"
              className="size-36 -rotate-90"
              aria-hidden
            >
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth="10"
                className={cn("stroke-current", tone.track)}
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                className={cn("stroke-current transition-all", tone.ring)}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span
                className={cn(
                  "font-heading text-4xl font-semibold tabular-nums",
                  tone.text
                )}
              >
                {score}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("drivers.detail.safety.outOf")}
              </span>
            </div>
          </div>
          <span className={cn("text-sm font-medium", tone.text)}>
            {t(tone.labelKey)}
          </span>
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t("drivers.detail.safety.drivingEvents")}
          </p>
          <MetricRow
            icon={Wind}
            label={t("drivers.detail.safety.harshBraking")}
            count={driver.harshBrakingCount}
            ceiling={15}
            barClass="bg-amber-500"
          />
          <MetricRow
            icon={Zap}
            label={t("drivers.detail.safety.harshAcceleration")}
            count={driver.harshAccelCount}
            ceiling={15}
            barClass="bg-orange-500"
          />
          <MetricRow
            icon={Gauge}
            label={t("drivers.detail.safety.speedingEvents")}
            count={driver.speedingCount}
            ceiling={10}
            barClass="bg-rose-500"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {t("drivers.detail.safety.assignedVehicle")}
          </p>
          {assignedVehicle ? (
            <Link
              to={`/fleet/${assignedVehicle.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Truck className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{assignedVehicle.plate}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {assignedVehicle.description}
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Truck className="size-4" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("drivers.detail.safety.noVehicle")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
