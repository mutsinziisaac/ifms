import {
  differenceInDays,
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
} from "date-fns"

import type { LatLng } from "@/data/types"

/** "3 minutes ago" / "12 seconds ago" */
export function formatRelativeTime(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
}

/** Duration since `sinceIso`, e.g. "2h 14m" or "45m" or "3d 4h" */
export function formatStatusDuration(sinceIso: string): string {
  const minutes = Math.max(0, differenceInMinutes(new Date(), new Date(sinceIso)))
  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

/** "9.0301° N, 38.7468° E" */
export function formatCoords(p: LatLng): string {
  const latHemi = p.lat >= 0 ? "N" : "S"
  const lngHemi = p.lng >= 0 ? "E" : "W"
  return `${Math.abs(p.lat).toFixed(4)}° ${latHemi}, ${Math.abs(p.lng).toFixed(4)}° ${lngHemi}`
}

/** "84,512 km" */
export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`
}

/** "72 km/h" */
export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`
}

/** "12 Jul 2026" */
export function formatDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy")
}

/** "12 Jul 2026, 14:03" */
export function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy, HH:mm")
}

/** "14:03:21" */
export function formatTime(iso: string): string {
  return format(new Date(iso), "HH:mm:ss")
}

export function fullName(person: {
  firstName: string
  lastName: string
}): string {
  return `${person.firstName} ${person.lastName}`
}

/** "Abebe Bekele" -> "AB" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("")
}

/** Days from now until an ISO date (negative when past) */
export function daysUntil(iso: string): number {
  return differenceInDays(new Date(iso), new Date())
}
