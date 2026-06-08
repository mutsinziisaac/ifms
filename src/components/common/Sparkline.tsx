import { useId } from "react"

import { cn } from "@/lib/utils"

export interface SparklineProps {
  /** Series of values, oldest → newest. Needs ≥ 2 points to draw. */
  data: number[]
  /** Stroke width in CSS pixels (kept crisp under non-uniform scaling). */
  strokeWidth?: number
  /** Pulse the newest point to signal a live feed. */
  live?: boolean
  className?: string
}

const WIDTH = 100
const HEIGHT = 36
const HPAD = 3
const VPAD = 4

/**
 * A tiny, dependency-free area sparkline. The SVG stretches to fill its parent
 * (`preserveAspectRatio="none"`) and paints with `currentColor`, so callers set
 * the accent by giving the wrapper a text color. Render inside a `relative`
 * box — the live dot is positioned in percentage units to dodge the SVG's
 * non-uniform scaling.
 */
export function Sparkline({
  data,
  strokeWidth = 1.75,
  live = true,
  className,
}: SparklineProps) {
  const gradientId = useId()

  if (data.length < 2) {
    return <div className={cn("relative h-full w-full", className)} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const innerW = WIDTH - HPAD * 2
  const innerH = HEIGHT - VPAD * 2
  const stepX = innerW / (data.length - 1)

  const points = data.map((value, i) => {
    const x = HPAD + i * stepX
    const y = VPAD + innerH - ((value - min) / range) * innerH
    return [x, y] as const
  })

  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ")
  const firstX = points[0][0]
  const [lastX, lastY] = points[points.length - 1]
  const area = `${line} L${lastX.toFixed(2)},${HEIGHT} L${firstX.toFixed(2)},${HEIGHT} Z`

  return (
    <div className={cn("relative h-full w-full", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute flex size-1.5 -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${(lastX / WIDTH) * 100}%`,
          top: `${(lastY / HEIGHT) * 100}%`,
        }}
      >
        {live && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-60" />
        )}
        <span className="relative inline-flex size-1.5 rounded-full bg-current" />
      </span>
    </div>
  )
}
