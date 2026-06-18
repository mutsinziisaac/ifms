// Live fleet stats per provider. Derived purely from the vehicle fleet (matched
// by provider code) so both Providers pages share one computation. Telemetry
// (messages/activity) is intentionally excluded — the live `/providers` endpoint
// carries no transmission data.

import type { Vehicle } from "@/data/types"

export interface ProviderStats {
  deviceCount: number
  onlineCount: number
  noSignalCount: number
  onlinePct: number
  lastSyncAt: string | null
}

// In real-backend mode a vehicle's `entityId` carries its provider code, so the
// fleet for a provider is every vehicle whose entityId matches that code.
export function computeProviderStats(
  code: string,
  vehicles: Vehicle[]
): ProviderStats {
  const fleet = vehicles.filter((v) => v.entityId === code)
  const noSignalCount = fleet.filter((v) => v.status === "no_signal").length
  const onlineCount = fleet.length - noSignalCount
  const lastSyncAt = fleet.reduce<string | null>(
    (latest, v) =>
      latest === null || v.lastSyncAt > latest ? v.lastSyncAt : latest,
    null
  )
  return {
    deviceCount: fleet.length,
    onlineCount,
    noSignalCount,
    onlinePct:
      fleet.length > 0 ? Math.round((onlineCount / fleet.length) * 100) : 0,
    lastSyncAt,
  }
}
