import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { MAINTENANCE_STATUS_CONFIG } from "@/lib/status"

export interface MaintenanceStatusCounts {
  ok: number
  waiting: number
  delay: number
}

const CHART_CONFIG = {
  count: { label: "Vehicles" },
  ok: {
    label: MAINTENANCE_STATUS_CONFIG.ok.label,
    color: MAINTENANCE_STATUS_CONFIG.ok.color,
  },
  waiting: {
    label: MAINTENANCE_STATUS_CONFIG.waiting.label,
    color: MAINTENANCE_STATUS_CONFIG.waiting.color,
  },
  delay: {
    label: MAINTENANCE_STATUS_CONFIG.delay.label,
    color: MAINTENANCE_STATUS_CONFIG.delay.color,
  },
} satisfies ChartConfig

export function MaintenanceStatusPie({
  counts,
  className,
}: {
  counts: MaintenanceStatusCounts
  className?: string
}) {
  const total = counts.ok + counts.waiting + counts.delay

  const data = useMemo(
    () =>
      (["ok", "waiting", "delay"] as const)
        .map((key) => ({
          key,
          label: MAINTENANCE_STATUS_CONFIG[key].label,
          count: counts[key],
          color: MAINTENANCE_STATUS_CONFIG[key].color,
        }))
        .filter((d) => d.count > 0),
    [counts]
  )

  if (total === 0) {
    return (
      <div className={className}>
        <div className="mx-auto grid size-[140px] place-items-center">
          <div className="grid size-[110px] place-items-center rounded-full border-[10px] border-muted">
            <span className="text-center text-xs text-muted-foreground">
              No vehicles
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ChartContainer
      config={CHART_CONFIG}
      className={className ?? "mx-auto aspect-square h-[140px]"}
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent nameKey="label" hideLabel />}
        />
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={42}
          outerRadius={62}
          strokeWidth={2}
          paddingAngle={data.length > 1 ? 2 : 0}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={entry.color} />
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
                    className="fill-foreground font-heading text-2xl font-semibold tabular-nums"
                  >
                    {total}
                  </tspan>
                  <tspan
                    x={viewBox.cx}
                    y={(viewBox.cy ?? 0) + 18}
                    className="fill-muted-foreground text-[11px]"
                  >
                    vehicles
                  </tspan>
                </text>
              )
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
