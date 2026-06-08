// In-memory database singleton for the IFMS prototype. Everything is dummy
// data — no backend. The store is a tiny observable: mutations bump a version
// number and notify subscribers, which lets high-frequency consumers (the live
// map) re-render via useSyncExternalStore without going through TanStack Query.

import { createSeedDB } from "./seed"
import type { DB } from "./types"

let db: DB | null = null
let version = 0
const listeners = new Set<() => void>()

/** Lazily seeded singleton database. */
export function getDB(): DB {
  if (db === null) {
    db = createSeedDB()
  }
  return db
}

/** Monotonic version number — the snapshot value for useSyncExternalStore. */
export function getVersion(): number {
  return version
}

/** Subscribe to store changes. Returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Run a mutator against the DB, bump the version, and notify listeners. */
export function mutate(mutator: (db: DB) => void): void {
  mutator(getDB())
  version++
  for (const listener of listeners) {
    listener()
  }
}
