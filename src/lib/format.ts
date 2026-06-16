import {
  differenceInDays,
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
} from "date-fns"

import type { LatLng } from "@/data/types"
import i18n from "@/i18n"

// date-fns ships no Amharic locale, so Amharic dates/relative-times use the
// browser-native Intl APIs. English keeps the exact date-fns output it had.
function isAmharic(): boolean {
  return (i18n.resolvedLanguage ?? i18n.language) === "am"
}

// Force the Gregorian calendar: all app data is Gregorian ISO, so we only want
// Amharic-script month names — not Ethiopian-calendar dates.
const AM_DATE = new Intl.DateTimeFormat("am-ET", {
  day: "numeric",
  month: "short",
  year: "numeric",
  calendar: "gregory",
})
const AM_DATE_TIME = new Intl.DateTimeFormat("am-ET", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  calendar: "gregory",
})

const RELATIVE_DIVISIONS: {
  amount: number
  unit: Intl.RelativeTimeFormatUnit
}[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
]

function relativeAmharic(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat("am", { numeric: "always" })
  let duration = (new Date(iso).getTime() - Date.now()) / 1000
  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return rtf.format(Math.round(duration), "year")
}

/** "3 minutes ago" / "12 seconds ago" */
export function formatRelativeTime(iso: string): string {
  if (isAmharic()) return relativeAmharic(iso)
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
}

/** Duration since `sinceIso`, e.g. "2h 14m" or "45m" or "3d 4h" */
export function formatStatusDuration(sinceIso: string): string {
  const minutes = Math.max(
    0,
    differenceInMinutes(new Date(), new Date(sinceIso))
  )
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

/** "ETB 12,500" — whole Ethiopian Birr */
export function formatEtb(amount: number): string {
  return `ETB ${Math.round(amount).toLocaleString("en-US")}`
}

/** "12 Jul 2026" */
export function formatDate(iso: string): string {
  if (isAmharic()) return AM_DATE.format(new Date(iso))
  return format(new Date(iso), "d MMM yyyy")
}

/** "12 Jul 2026, 14:03" */
export function formatDateTime(iso: string): string {
  if (isAmharic()) return AM_DATE_TIME.format(new Date(iso))
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
