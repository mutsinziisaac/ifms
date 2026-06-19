import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { isRealApi } from "@/data/api"
import {
  useEntities,
  useGeozones,
  useLiveVehicles,
  useRoutes,
} from "@/data/hooks"
import type { Vehicle } from "@/data/types"
import { boundsOf, padBounds } from "@/lib/maps"

import { FleetMap } from "./FleetMap"
import { GeozoneOverlay } from "./GeozoneOverlay"
import { RoutePolyline } from "./RoutePolyline"
import { VehicleMarker } from "./VehicleMarker"

/**
 * Live fleet map composition: the themed <FleetMap> auto-fitted to the fleet,
 * with active corridor routes, POI geozones and a marker per vehicle. Clicking a
 * vehicle navigates to its detail page. Shared by the dashboard card and the
 * full-screen live map page; the caller controls sizing via `className`.
 */
export function FleetLiveMap({ className }: { className?: string }) {
  const navigate = useNavigate()
  const vehicles = useLiveVehicles()
  const geozones = useGeozones().data ?? []
  const routes = useRoutes().data ?? []
  const entities = useEntities().data ?? []

  const geozoneNameById = useMemo(
    () => new Map(geozones.map((z) => [z.id, z.name])),
    [geozones]
  )

  // Resolve the operating provider/entity name for each vehicle. Seeded
  // vehicles carry an `entityId`; the live backend map endpoint carries no
  // entity id but sends a `provider_name` (mapped onto `vehicle.provider`),
  // which the marker falls back to below.
  const entityNameById = useMemo(
    () => new Map(entities.map((e) => [e.id, e.shortName])),
    [entities]
  )

  const bounds = useMemo(() => {
    const points = vehicles.map((v) => v.position)
    const base = boundsOf(points)
    return base ? padBounds(base, 0.18) : null
  }, [vehicles])

  // Geozones and routes are still seeded (not migrated to the backend), so hide
  // them against the real backend — the map then shows only real vehicles.
  const poiZones = isRealApi ? [] : geozones.filter((z) => z.isPOI && z.visible)
  const activeRoutes = isRealApi ? [] : routes.filter((r) => r.active)

  return (
    <FleetMap bounds={bounds} className={className} enableRightClickCoords={false}>
      {activeRoutes.map((route) => (
        <RoutePolyline
          key={route.id}
          path={route.path}
          active={false}
          color="#0d9488"
        />
      ))}
      {poiZones.map((zone) => (
        <GeozoneOverlay key={zone.id} zone={zone} color="#64748b" />
      ))}
      {vehicles.map((vehicle: Vehicle) => (
        <VehicleMarker
          key={vehicle.id}
          vehicle={vehicle}
          geozoneName={
            vehicle.insideGeozoneId
              ? geozoneNameById.get(vehicle.insideGeozoneId)
              : undefined
          }
          providerName={
            entityNameById.get(vehicle.entityId) ?? vehicle.provider
          }
          onClick={(v) => navigate(`/fleet/${v.id}`)}
        />
      ))}
    </FleetMap>
  )
}
