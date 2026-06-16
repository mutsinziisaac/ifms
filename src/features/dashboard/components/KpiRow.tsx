import { useEffect, useRef, useState } from "react"
import { Bell, Gauge, Navigation, PauseCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useLiveEvents, useLiveVehicles } from "@/data/hooks"
import { formatSpeed } from "@/lib/format"

import { ActivityStatCard } from "./ActivityStatCard"

/** Points kept in each sparkline — ~28 ticks of live history. */
const SERIES_LENGTH = 28

interface Sample {
  moving: number
  speed: number
  idling: number
  events: number
}

/** Deterministic, gentle wave around each value so cards look alive on first paint. */
function seedHistory(sample: Sample, length: number): Sample[] {
  const wobble = (value: number, i: number) => {
    if (value <= 0) return 0
    const wave = Math.sin(i / 2.5) * 0.06 + Math.sin(i / 4) * 0.035
    return Math.max(0, value * (1 + wave))
  }
  return Array.from({ length }, (_, i) => ({
    moving: wobble(sample.moving, i),
    speed: wobble(sample.speed, i),
    idling: wobble(sample.idling, i),
    events: wobble(sample.events, i),
  }))
}

export function KpiRow() {
  const { t } = useTranslation()
  const vehicles = useLiveVehicles()
  const events = useLiveEvents()

  const total = vehicles.length
  const moving = vehicles.filter((v) => v.status === "moving").length
  const idling = vehicles.filter((v) => v.status === "idling").length

  const movingVehicles = vehicles.filter((v) => v.status === "moving")
  const avgSpeed =
    movingVehicles.length > 0
      ? movingVehicles.reduce((sum, v) => sum + v.speedKmh, 0) /
        movingVehicles.length
      : 0

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  const eventsToday = events.filter(
    (e) => new Date(e.at).getTime() >= dayAgo
  ).length

  // Newest telemetry timestamp; advancing it marks a fresh simulation tick.
  const tick = vehicles.reduce<string | null>(
    (latest, v) =>
      latest === null || v.lastSyncAt > latest ? v.lastSyncAt : latest,
    null
  )

  // Rolling history that scrolls every sparkline forward in unison. Seeded with
  // a gentle wave so the cards have a curve before real samples arrive.
  const [history, setHistory] = useState<Sample[]>(() =>
    seedHistory(
      { moving, speed: avgSpeed, idling, events: eventsToday },
      SERIES_LENGTH
    )
  )
  const lastTickRef = useRef<string | null>(null)

  useEffect(() => {
    if (tick === null || tick === lastTickRef.current) return
    lastTickRef.current = tick
    setHistory((prev) => {
      const next =
        prev.length >= SERIES_LENGTH
          ? prev.slice(prev.length - SERIES_LENGTH + 1)
          : prev.slice()
      next.push({ moving, speed: avgSpeed, idling, events: eventsToday })
      return next
    })
  }, [tick, moving, avgSpeed, idling, eventsToday])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <ActivityStatCard
        label={t("dashboard.kpi.movingNow")}
        value={moving}
        series={history.map((h) => h.moving)}
        icon={Navigation}
        intent="success"
        hint={t("dashboard.kpi.ofTracked", { count: total })}
      />
      <ActivityStatCard
        label={t("dashboard.kpi.averageSpeed")}
        value={formatSpeed(avgSpeed)}
        series={history.map((h) => h.speed)}
        icon={Gauge}
        intent="default"
        hint={t("dashboard.kpi.liveCorridorAverage")}
      />
      <ActivityStatCard
        label={t("dashboard.kpi.idling")}
        value={idling}
        series={history.map((h) => h.idling)}
        icon={PauseCircle}
        intent="warning"
        hint={t("dashboard.kpi.engineOnStationary")}
      />
      <ActivityStatCard
        label={t("dashboard.kpi.eventsToday")}
        value={eventsToday}
        series={history.map((h) => h.events)}
        icon={Bell}
        intent={eventsToday > 0 ? "danger" : "default"}
        hint={t("dashboard.kpi.last24Hours")}
      />
    </div>
  )
}
