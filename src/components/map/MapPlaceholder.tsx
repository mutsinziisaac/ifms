import { MapPinned } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Attractive fallback shown when Google Maps is unavailable (no API key).
 * Fills its container with a subtle grid pattern and a centered message.
 */
export function MapPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/40",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative flex max-w-xs flex-col items-center gap-3 px-6 text-center">
        <div className="grid size-12 place-items-center rounded-xl border bg-background/80 shadow-sm">
          <MapPinned className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Live map unavailable</p>
          <p className="text-xs text-muted-foreground">
            Add VITE_GOOGLE_MAPS_API_KEY to .env and restart to enable Google
            Maps.
          </p>
        </div>
      </div>
    </div>
  )
}
