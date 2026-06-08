/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react"
import { APIProvider } from "@vis.gl/react-google-maps"

const MapsAvailableContext = createContext(false)

/**
 * Wraps the app in the Google Maps APIProvider when a key is configured.
 * When the key is missing it renders children un-wrapped and reports the
 * maps layer as unavailable so consumers can fall back gracefully.
 */
export function MapsProvider({ children }: { children: React.ReactNode }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  if (!apiKey) {
    return (
      <MapsAvailableContext.Provider value={false}>
        {children}
      </MapsAvailableContext.Provider>
    )
  }

  return (
    <MapsAvailableContext.Provider value={true}>
      <APIProvider
        apiKey={apiKey}
        libraries={["drawing", "geometry", "marker"]}
      >
        {children}
      </APIProvider>
    </MapsAvailableContext.Provider>
  )
}

/** True when a Google Maps API key is configured and the provider is active. */
export function useMapsAvailable(): boolean {
  return useContext(MapsAvailableContext)
}
