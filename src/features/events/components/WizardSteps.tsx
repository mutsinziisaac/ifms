import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface WizardStepsProps {
  steps: string[]
  /** Zero-based index of the active step */
  current: number
}

/** Horizontal numbered step indicator with connectors. */
export function WizardSteps({ steps, current }: WizardStepsProps) {
  return (
    <ol className="flex flex-wrap items-center gap-y-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "ml-2 text-sm whitespace-nowrap",
                active ? "font-medium" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mx-3 h-px w-6 sm:w-10",
                  done ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
