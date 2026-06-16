import { useMemo } from "react"
import { useTranslation } from "react-i18next"
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

export function MaintenanceStatusPie({
  counts,
  className,
}: {
  counts: MaintenanceStatusCounts
  className?: string
}) {
  const { t } = useTranslation()
  const total = counts.ok + counts.waiting + counts.delay

  const chartConfig = {
    count: { label: t("maintenance.pie.vehicles") },
    ok: {
      label: t("enums.maintenanceStatus.ok"),
      color: MAINTENANCE_STATUS_CONFIG.ok.color,
    },
    waiting: {
      label: t("enums.maintenanceStatus.waiting"),
      color: MAINTENANCE_STATUS_CONFIG.waiting.color,
    },
    delay: {
      label: t("enums.maintenanceStatus.delay"),
      color: MAINTENANCE_STATUS_CONFIG.delay.color,
    },
  } satisfies ChartConfig

  const data = useMemo(
    () =>
      (["ok", "waiting", "delay"] as const)
        .map((key) => ({
          key,
          label: t(`enums.maintenanceStatus.${key}`),
          count: counts[key],
          color: MAINTENANCE_STATUS_CONFIG[key].color,
        }))
        .filter((d) => d.count > 0),
    [counts, t]
  )

  if (total === 0) {
    return (
      <div className={className}>
        <div className="mx-auto grid size-[140px] place-items-center">
          <div className="grid size-[110px] place-items-center rounded-full border-[10px] border-muted">
            <span className="text-center text-xs text-muted-foreground">
              {t("maintenance.pie.noVehicles")}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
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
                    {t("maintenance.pie.vehiclesLabel")}
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
