import { useMemo } from "react"
import { AdvancedMarker } from "@vis.gl/react-google-maps"

import { FleetMap } from "@/components/map/FleetMap"
import type { FleetEvent } from "@/data/types"
import { boundsOf, padBounds } from "@/lib/maps"
import { EVENT_SEVERITY_CONFIG } from "@/lib/status"
import { cn } from "@/lib/utils"

export interface EventsMapViewProps {
  events: FleetEvent[]
  selectedId: string | null
  onSelect: (event: FleetEvent) => void
  className?: string
}

export function EventsMapView({
  events,
  selectedId,
  onSelect,
  className,
}: EventsMapViewProps) {
  const bounds = useMemo(() => {
    const raw = boundsOf(events.map((e) => e.location))
    return raw ? padBounds(raw, 0.15) : null
  }, [events])

  return (
    <div
      className={cn("h-[560px] overflow-hidden rounded-2xl border", className)}
    >
      <FleetMap bounds={bounds}>
        {events.map((event) => {
          const color = EVENT_SEVERITY_CONFIG[event.severity].color
          const closed = event.status === "closed"
          const selected = event.id === selectedId
          const alerting = event.status === "open" && event.severity === "critical"
          return (
            <AdvancedMarker
              key={event.id}
              position={event.location}
              onClick={() => onSelect(event)}
              zIndex={alerting ? 40 : selected ? 30 : closed ? 10 : 20}
            >
              <span className="relative grid place-items-center">
                {alerting && (
                  <span
                    className="absolute size-3.5 animate-ping rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span
                  className={cn(
                    "block rounded-full border-2 border-white shadow-md transition-transform dark:border-zinc-900",
                    selected ? "size-5 scale-110" : "size-3.5",
                    closed && !selected && "opacity-40"
                  )}
                  style={{
                    backgroundColor: color,
                    ...(selected
                      ? { boxShadow: `0 0 0 4px ${color}40` }
                      : undefined),
                  }}
                />
              </span>
            </AdvancedMarker>
          )
        })}
      </FleetMap>
    </div>
  )
}
