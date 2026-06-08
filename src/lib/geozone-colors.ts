// Palette for geozone groups. Geozones without a group render in the
// default corridor teal.

export const DEFAULT_GEOZONE_COLOR = "#0d9488"

export const GEOZONE_GROUP_COLORS = [
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#ec4899",
] as const

export function geozoneGroupColor(index: number): string {
  return GEOZONE_GROUP_COLORS[index % GEOZONE_GROUP_COLORS.length]!
}
