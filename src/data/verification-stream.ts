// Live ITMS verification stream (GET /api/v1/vehicles/verification/stream).
//
// EventSource can't attach an Authorization header, and the backend requires the
// Keycloak bearer token — so we consume the SSE stream with `fetch` + a
// ReadableStream reader, re-attaching a fresh token on every (re)connect. Each
// event flips a vehicle's verification status; we patch the live-map cache for an
// instant marker update and invalidate the fleet list so its badge/filter follow.

import { toast } from "sonner"

import { isKeycloakConfigured, keycloak } from "@/auth/keycloak"
import i18n from "@/i18n"
import { queryClient } from "@/lib/query-client"

import { qk } from "./query-keys"
import type { ItmsVerificationStatus, Vehicle } from "./types"

interface VehicleVerificationEvent {
  vehicle_id: number
  plate_number?: string | null
  previous_status?: ItmsVerificationStatus
  status: ItmsVerificationStatus
  occurred_at?: string
}

const STREAM_URL = `${import.meta.env.VITE_API_BASE_URL ?? ""}/vehicles/verification/stream`
const MAX_BACKOFF_MS = 15000

/**
 * Open the verification stream and keep it open (auto-reconnect with backoff).
 * Returns an unsubscribe that aborts the connection. Safe under StrictMode: the
 * effect cleanup aborts the in-flight reader before a re-subscribe.
 */
export function subscribeVerificationStream(): () => void {
  const controller = new AbortController()
  let stopped = false
  let backoff = 1000

  async function connect(): Promise<void> {
    while (!stopped) {
      try {
        const headers: Record<string, string> = { Accept: "text/event-stream" }
        if (isKeycloakConfigured && keycloak) {
          try {
            await keycloak.updateToken(30)
          } catch {
            // token refresh failed — try anyway; a 401 just triggers a retry
          }
          if (keycloak.token) headers.Authorization = `Bearer ${keycloak.token}`
        }

        const res = await fetch(STREAM_URL, {
          headers,
          signal: controller.signal,
        })
        if (!res.ok || !res.body) throw new Error(`stream HTTP ${res.status}`)
        backoff = 1000 // healthy connection — reset backoff

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // SSE frames are separated by a blank line.
          let sep: number
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            handleFrame(buffer.slice(0, sep))
            buffer = buffer.slice(sep + 2)
          }
        }
      } catch {
        if (stopped || controller.signal.aborted) return
      }
      // Reconnect with exponential backoff.
      await new Promise((resolve) => setTimeout(resolve, backoff))
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS)
    }
  }

  void connect()
  return () => {
    stopped = true
    controller.abort()
  }
}

function handleFrame(frame: string): void {
  const payload = frame
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("\n")
  if (!payload) return

  let event: VehicleVerificationEvent
  try {
    event = JSON.parse(payload)
  } catch {
    return // keepalive / non-JSON frame
  }
  if (event?.vehicle_id == null || !event.status) return

  applyVerificationEvent(event)
}

function applyVerificationEvent(event: VehicleVerificationEvent): void {
  const id = String(event.vehicle_id)

  // Instant: patch the polled map snapshot so the marker recolors immediately.
  queryClient.setQueryData<Vehicle[]>(qk.vehiclesMap, (prev) =>
    prev?.map((v) =>
      v.id === id ? { ...v, itmsVerificationStatus: event.status } : v
    )
  )
  // Follow-up: refresh anything else under the "vehicles" prefix (the fleet list
  // badge/filter + a confirming map refetch).
  queryClient.invalidateQueries({ queryKey: qk.vehicles })

  toast(
    i18n.t("vehicles.toast.verificationChanged", {
      plate: event.plate_number ?? `#${event.vehicle_id}`,
      status: i18n.t(`enums.itmsVerificationStatus.${event.status}`),
    })
  )
}
