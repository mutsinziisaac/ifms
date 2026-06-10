// Live transmission stats per provider (government entity). Derived from the
// vehicle fleet + sim-fed telemetry so both Providers pages share one
// computation.

import type { Entity, ProviderTelemetry, Vehicle } from "@/data/types"

export interface ProviderStats {
  deviceCount: number
  onlineCount: number
  noSignalCount: number
  onlinePct: number
  lastSyncAt: string | null
  messagesTotal: number
  history: number[]
}

export function computeProviderStats(
  entity: Entity,
  vehicles: Vehicle[],
  telemetry: ProviderTelemetry[]
): ProviderStats {
  const fleet = vehicles.filter((v) => v.entityId === entity.id)
  const noSignalCount = fleet.filter((v) => v.status === "no_signal").length
  const onlineCount = fleet.length - noSignalCount
  const lastSyncAt = fleet.reduce<string | null>(
    (latest, v) =>
      latest === null || v.lastSyncAt > latest ? v.lastSyncAt : latest,
    null
  )
  const t = telemetry.find((x) => x.entityId === entity.id)
  return {
    deviceCount: fleet.length,
    onlineCount,
    noSignalCount,
    onlinePct:
      fleet.length > 0 ? Math.round((onlineCount / fleet.length) * 100) : 0,
    lastSyncAt,
    messagesTotal: t?.messagesTotal ?? 0,
    history: t?.history ?? [],
  }
}
