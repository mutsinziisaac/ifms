import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { CategoryDatum } from "@/components/common/CategoryDonut"

/**
 * Reusable vertical bar chart for a categorical breakdown (counts or amounts).
 * `valueLabel` is the series name shown in the tooltip row; the heading is the
 * hovered category (from the X axis).
 */
export function CategoryBars({
  data,
  valueLabel,
  className,
}: {
  data: CategoryDatum[]
  valueLabel: string
  className?: string
}) {
  const config = { value: { label: valueLabel } } satisfies ChartConfig

  return (
    <ChartContainer config={config} className={className ?? "aspect-[16/9] w-full"}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis hide allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
