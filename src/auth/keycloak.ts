import Keycloak from "keycloak-js"

import type { SessionUser } from "@/data/types"

// ---------------------------------------------------------------------------
// Configuration (from .env — VITE_KEYCLOAK_*)
// ---------------------------------------------------------------------------

const url = (import.meta.env.VITE_KEYCLOAK_URL as string | undefined)?.trim()
const realm = (import.meta.env.VITE_KEYCLOAK_REALM as string | undefined)?.trim()
const clientId = (
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined
)?.trim()

/**
 * True only when all three Keycloak settings are present. When false the app
 * falls back to the prototype's mock auth — mirroring how `MapsProvider`
 * degrades without a Google Maps key, so the demo always runs.
 */
export const isKeycloakConfigured = Boolean(url && realm && clientId)

/**
 * The single shared Keycloak instance, or `null` when not configured.
 * Creating it does not touch the network — that happens in {@link initKeycloak}.
 */
export const keycloak =
  isKeycloakConfigured && url && realm && clientId
    ? new Keycloak({ url, realm, clientId })
    : null

// ---------------------------------------------------------------------------
// One-time init (memoized so React StrictMode's double-mount can't init twice —
// keycloak-js throws if `init()` is called more than once)
// ---------------------------------------------------------------------------

let initPromise: Promise<boolean> | null = null

/** Resolve the initial SSO state. Returns `false` immediately when unconfigured. */
export function initKeycloak(): Promise<boolean> {
  if (!keycloak) return Promise.resolve(false)
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: "check-sso",
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: "S256",
    })
  }
  return initPromise
}

// ---------------------------------------------------------------------------
// Token claims → app SessionUser
// ---------------------------------------------------------------------------

const DEFAULT_ROLE = "Fleet Operations Officer"

/** Built-in Keycloak realm roles that aren't meaningful as a display role. */
const IGNORED_ROLES = new Set([
  "offline_access",
  "uma_authorization",
  `default-roles-${(realm ?? "").toLowerCase()}`,
])

/** "fleet-operations-officer" -> "Fleet Operations Officer" */
function humanizeRole(role: string): string {
  return role
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/** Surface the first business realm role, else a sensible default. */
function pickRole(roles: string[]): string {
  const meaningful = roles.filter((role) => !IGNORED_ROLES.has(role))
  if (meaningful.length === 0) return DEFAULT_ROLE
  return humanizeRole(meaningful[0])
}

interface KeycloakClaims {
  name?: string
  preferred_username?: string
  email?: string
  given_name?: string
  family_name?: string
  realm_access?: { roles?: string[] }
}

/** Build the app's {@link SessionUser} from the parsed Keycloak access token. */
export function sessionUserFromKeycloak(kc: Keycloak): SessionUser {
  const claims = (kc.tokenParsed ?? {}) as KeycloakClaims
  const fullName = [claims.given_name, claims.family_name]
    .filter(Boolean)
    .join(" ")
  const name =
    claims.name ||
    fullName ||
    claims.preferred_username ||
    claims.email ||
    "Fleet Officer"
  const email = claims.email ?? claims.preferred_username ?? ""
  const role = pickRole(claims.realm_access?.roles ?? [])
  return { name, email, role }
}
