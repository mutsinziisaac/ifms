// Tiny CSV helpers for the geozone import flow (SRS: pre-defined CSV
// template, each zone is a list of lat/lng points).

import type { LatLng } from "@/data/types"

export const GEOZONE_CSV_TEMPLATE = `zone_name,lat,lng
Modjo Customs Yard,8.5832,39.1212
Modjo Customs Yard,8.5832,39.1322
Modjo Customs Yard,8.5732,39.1322
Modjo Customs Yard,8.5732,39.1212
Awash Rest Stop,8.9912,40.1665
Awash Rest Stop,8.9912,40.1775
Awash Rest Stop,8.9812,40.1775
Awash Rest Stop,8.9812,40.1665
`

export interface CsvGeozone {
  name: string
  points: LatLng[]
}

export interface CsvParseResult {
  zones: CsvGeozone[]
  errors: string[]
}

/**
 * Parses the predefined geozone CSV template: header `zone_name,lat,lng`,
 * one point per row, rows grouped into zones by name (in file order).
 */
export function parseGeozoneCsv(text: string): CsvParseResult {
  const errors: string[] = []
  const zonesByName = new Map<string, CsvGeozone>()

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return { zones: [], errors: ["The file is empty."] }
  }

  const header = splitCsvLine(lines[0]!).map((cell) => cell.toLowerCase())
  const startIndex =
    header[0] === "zone_name" || header.includes("lat") ? 1 : 0
  if (startIndex === 0) {
    errors.push('Missing header row — expected "zone_name,lat,lng".')
  }

  for (let i = startIndex; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]!)
    if (cells.length < 3) {
      errors.push(`Row ${i + 1}: expected 3 columns, got ${cells.length}.`)
      continue
    }
    const [name, latRaw, lngRaw] = cells as [string, string, string]
    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (!name) {
      errors.push(`Row ${i + 1}: missing zone name.`)
      continue
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      errors.push(`Row ${i + 1}: invalid latitude "${latRaw}".`)
      continue
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      errors.push(`Row ${i + 1}: invalid longitude "${lngRaw}".`)
      continue
    }
    const zone = zonesByName.get(name) ?? { name, points: [] }
    zone.points.push({ lat, lng })
    zonesByName.set(name, zone)
  }

  const zones: CsvGeozone[] = []
  for (const zone of zonesByName.values()) {
    if (zone.points.length < 3) {
      errors.push(
        `Zone "${zone.name}": needs at least 3 points to form a polygon (has ${zone.points.length}).`
      )
      continue
    }
    zones.push(zone)
  }

  return { zones, errors }
}

/** Minimal CSV line splitter with double-quote support */
function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

/** Serialize a header row + data rows to RFC-4180-ish CSV text. */
export function toCsv(
  headers: string[],
  rows: (string | number)[][]
): string {
  const escape = (value: string | number): string => {
    const s = String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n")
}

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
