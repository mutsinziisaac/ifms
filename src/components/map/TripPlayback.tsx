import { useEffect, useRef, useState } from "react"
import { AdvancedMarker } from "@vis.gl/react-google-maps"
import { Pause, Play, Truck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { boundsOf, interpolateAlongPath, padBounds } from "@/lib/maps"
import { cn } from "@/lib/utils"

import { FleetMap } from "./FleetMap"
import { RoutePolyline } from "./RoutePolyline"
import type { LatLng } from "@/data/types"

export interface TripPlaybackProps {
  path: LatLng[]
  className?: string
}

const SPEEDS = [1, 2, 4] as const
type Speed = (typeof SPEEDS)[number]

/** Full path runs in ~30s at 1x. */
const DURATION_MS = 30_000

export function TripPlayback(props: TripPlaybackProps) {
  const { path, className } = props

  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)

  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const speedRef = useRef<Speed>(speed)

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  useEffect(() => {
    if (!playing) {
      lastTsRef.current = null
      return
    }

    const step = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const dt = ts - lastTsRef.current
      lastTsRef.current = ts

      setT((prev) => {
        const next = prev + (dt * speedRef.current) / DURATION_MS
        if (next >= 1) {
          setPlaying(false)
          return 1
        }
        return next
      })

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [playing])

  const bounds = path.length > 0 ? padBounds(boundsOf(path)!) : null
  const marker = interpolateAlongPath(path, t)

  const togglePlay = () => {
    setPlaying((prev) => {
      // Restart from the beginning if at the end.
      if (!prev && t >= 1) setT(0)
      return !prev
    })
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="h-[320px]">
        <FleetMap
          bounds={bounds}
          showMapTypeControl={false}
          enableRightClickCoords={false}
        >
          <RoutePolyline path={path} />
          {path.length > 0 ? (
            <AdvancedMarker position={marker.position}>
              <div className="grid size-6 place-items-center rounded-full bg-primary shadow ring-2 ring-white">
                <Truck className="size-3 text-white" />
              </div>
            </AdvancedMarker>
          ) : null}
        </FleetMap>
      </div>

      <div className="flex items-center gap-3 pt-3">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>

        <Slider
          value={[Math.round(t * 1000)]}
          max={1000}
          onValueChange={(value) => {
            setPlaying(false)
            setT((value[0] ?? 0) / 1000)
          }}
          className="flex-1"
        />

        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
          {Math.round(t * 100)}%
        </span>

        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-medium tabular-nums transition-colors",
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
