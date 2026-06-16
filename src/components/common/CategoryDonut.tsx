import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export interface CategoryDatum {
  key: string
  label: string
  value: number
  color: string
}

/** Reusable donut for a categorical distribution (severity, status, …). */
export function CategoryDonut({
  data,
  centerLabel,
  className,
}: {
  data: CategoryDatum[]
  centerLabel?: string
  className?: string
}) {
  const shown = useMemo(() => data.filter((d) => d.value > 0), [data])
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])

  const config = useMemo(
    () =>
      data.reduce((acc, d) => {
        acc[d.key] = { label: d.label, color: d.color }
        return acc
      }, {} as ChartConfig),
    [data]
  )

  if (total === 0) {
    return (
      <div className={cn("grid place-items-center py-8", className)}>
        <div className="grid size-[120px] place-items-center rounded-full border-[10px] border-muted">
          <span className="text-xs text-muted-foreground">—</span>
        </div>
      </div>
    )
  }

  return (
    <ChartContainer
      config={config}
      className={className ?? "mx-auto aspect-square max-h-[200px]"}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="label" hideLabel />}
        />
        <Pie
          data={shown}
          dataKey="value"
          nameKey="label"
          innerRadius={58}
          outerRadius={84}
          strokeWidth={2}
          paddingAngle={shown.length > 1 ? 2 : 0}
        >
          {shown.map((entry) => (
            <Cell key={entry.key} fill={entry.color} className="stroke-card" />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                return null
              }
              return (
                <text
                  x={viewBox.cx}
                  y={viewBox.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  <tspan
                    x={viewBox.cx}
                    y={viewBox.cy}
                    className="fill-foreground font-heading text-3xl font-semibold tabular-nums"
                  >
                    {total}
                  </tspan>
                  {centerLabel ? (
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy ?? 0) + 22}
                      className="fill-muted-foreground text-xs"
                    >
                      {centerLabel}
                    </tspan>
                  ) : null}
                </text>
              )
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
