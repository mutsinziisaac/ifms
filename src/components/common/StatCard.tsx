import type { LucideIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatCardProps {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
  hint?: React.ReactNode
  intent?: "default" | "success" | "warning" | "danger"
  className?: string
}

const INTENT_TINT: Record<NonNullable<StatCardProps["intent"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  intent = "default",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "flex-row items-start justify-between gap-3 p-4",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint != null && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      {Icon && (
        <div
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            INTENT_TINT[intent]
          )}
        >
          <Icon className="size-4" />
        </div>
      )}
    </Card>
  )
}
