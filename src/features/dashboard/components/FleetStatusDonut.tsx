import { Cell, Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useLiveVehicles } from "@/data/hooks"
import { VEHICLE_STATUS_CONFIG } from "@/lib/status"
import { VEHICLE_STATUSES } from "@/data/types"
import { cn } from "@/lib/utils"

const chartConfig: ChartConfig = VEHICLE_STATUSES.reduce((acc, status) => {
  acc[status] = {
    label: VEHICLE_STATUS_CONFIG[status].label,
    color: VEHICLE_STATUS_CONFIG[status].color,
  }
  return acc
}, {} as ChartConfig)

export function FleetStatusDonut() {
  const vehicles = useLiveVehicles()
  const total = vehicles.length

  const data = VEHICLE_STATUSES.map((status) => ({
    status,
    label: VEHICLE_STATUS_CONFIG[status].label,
    count: vehicles.filter((v) => v.status === status).length,
    color: VEHICLE_STATUS_CONFIG[status].color,
  })).filter((d) => d.count > 0)

  return (
    <Card className="gap-0">
      <CardHeader>
        <CardTitle>Fleet status</CardTitle>
        <CardDescription>Live distribution across the fleet</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Skeleton className="size-44 rounded-full" />
          </div>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[200px]"
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
                  innerRadius={62}
                  outerRadius={88}
                  strokeWidth={2}
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={entry.color}
                      className="stroke-card"
                    />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (
                        !viewBox ||
                        !("cx" in viewBox) ||
                        !("cy" in viewBox)
                      ) {
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
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 22}
                            className="fill-muted-foreground text-xs"
                          >
                            Vehicles
                          </tspan>
                        </text>
                      )
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {VEHICLE_STATUSES.map((status) => {
                const count = vehicles.filter((v) => v.status === status).length
                return (
                  <li
                    key={status}
                    className={cn(
                      "flex items-center justify-between gap-2 text-sm",
                      count === 0 && "opacity-50"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: VEHICLE_STATUS_CONFIG[status].color,
                        }}
                      />
                      <span className="truncate text-muted-foreground">
                        {VEHICLE_STATUS_CONFIG[status].label}
                      </span>
                    </span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
