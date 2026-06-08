import type { LucideIcon } from "lucide-react"

import { Sparkline } from "@/components/common/Sparkline"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type StatIntent = "default" | "success" | "warning" | "danger"

export interface ActivityStatCardProps {
  label: string
  value: React.ReactNode
  /** Live history (oldest → newest) feeding the sparkline. */
  series: number[]
  icon?: LucideIcon
  hint?: React.ReactNode
  intent?: StatIntent
  className?: string
}

const ICON_TINT: Record<StatIntent, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
}

const SPARK_TINT: Record<StatIntent, string> = {
  default: "text-primary",
  success: "text-emerald-500 dark:text-emerald-400",
  warning: "text-amber-500 dark:text-amber-400",
  danger: "text-rose-500 dark:text-rose-400",
}

/**
 * KPI card with a live area sparkline bled to the card's bottom edge. Pair with
 * `useRollingSeries` so the chart scrolls on every simulation tick.
 */
export function ActivityStatCard({
  label,
  value,
  series,
  icon: Icon,
  hint,
  intent = "default",
  className,
}: ActivityStatCardProps) {
  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden p-4 transition-shadow hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {Icon && (
          <div
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-md",
              ICON_TINT[intent]
            )}
          >
            <Icon className="size-3.5" />
          </div>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint != null && (
          <p className="truncate text-xs text-muted-foreground">{hint}</p>
        )}
      </div>

      <div className={cn("-mx-4 mt-3 -mb-4 h-8", SPARK_TINT[intent])}>
        <Sparkline data={series} />
      </div>
    </Card>
  )
}
