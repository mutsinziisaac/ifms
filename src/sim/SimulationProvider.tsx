// React context that owns the live simulation engine. It starts the engine
// once (StrictMode-safe via a ref) and forwards paused/speed changes to the
// running handle. Components read playback state with useSimulation().

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react"

import { startSimulation, type SimulationHandle } from "./simulation"

export type SimulationSpeed = 1 | 4 | 16

interface SimulationContextValue {
  paused: boolean
  setPaused: (paused: boolean) => void
  speed: number
  setSpeed: (speed: number) => void
}

const SimulationContext = createContext<SimulationContextValue | null>(null)

export function SimulationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [paused, setPaused] = useState(false)
  // Default 4x so the demo pops.
  const [speed, setSpeed] = useState<number>(4)
  const handleRef = useRef<SimulationHandle | null>(null)

  // Start the engine once. The ref guard keeps it single under StrictMode's
  // double-invoked effects.
  useEffect(() => {
    const handle = startSimulation()
    handleRef.current = handle
    return () => {
      handle.stop()
      handleRef.current = null
    }
  }, [])

  // Forward playback changes to the running handle.
  useEffect(() => {
    handleRef.current?.setPaused(paused)
  }, [paused])

  useEffect(() => {
    handleRef.current?.setSpeed(speed)
  }, [speed])

  return (
    <SimulationContext.Provider value={{ paused, setPaused, speed, setSpeed }}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation(): SimulationContextValue {
  const ctx = useContext(SimulationContext)
  if (ctx === null) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return ctx
}
