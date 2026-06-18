/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import type { SessionUser } from "@/data/types"
import {
  initKeycloak,
  isKeycloakConfigured,
  keycloak,
  sessionUserFromKeycloak,
} from "@/auth/keycloak"

const STORAGE_KEY = "ifms.auth"
const DEFAULT_ROLE = "Fleet Operations Officer"

export type AuthMode = "keycloak" | "mock"

interface AuthContextValue {
  user: SessionUser | null
  /**
   * Start a sign-in. In Keycloak mode this redirects to the identity provider
   * (`email`, if given, is used as a login hint); in mock mode `email` is the
   * identity itself.
   */
  login: (email?: string) => void
  logout: () => void
  /** True until Keycloak resolves the initial SSO check. Always false in mock mode. */
  initializing: boolean
  mode: AuthMode
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Mock auth — the prototype default when Keycloak isn't configured
// ---------------------------------------------------------------------------

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    if (
      parsed &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.role === "string"
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/** "dawit.haile@motl.gov.et" -> "Dawit Haile"; falls back to "Fleet Officer" */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? ""
  const parts = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  if (parts.length === 0) return "Fleet Officer"
  return parts.join(" ")
}

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(() =>
    readStoredUser()
  )

  const login = React.useCallback((email?: string) => {
    const resolved = email && email.length > 0 ? email : "officer@motl.gov.et"
    const next: SessionUser = {
      name: nameFromEmail(resolved),
      email: resolved,
      role: DEFAULT_ROLE,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUser(next)
  }, [])

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, login, logout, initializing: false, mode: "mock" }),
    [user, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Keycloak auth — used when VITE_KEYCLOAK_* are configured
// ---------------------------------------------------------------------------

function KeycloakAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null)
  const [initializing, setInitializing] = React.useState(true)

  React.useEffect(() => {
    const kc = keycloak
    if (!kc) return
    let cancelled = false

    const syncUser = () =>
      setUser(kc.authenticated ? sessionUserFromKeycloak(kc) : null)

    // Keep the session alive and the user in sync with token lifecycle events.
    kc.onAuthSuccess = syncUser
    kc.onAuthRefreshSuccess = syncUser
    kc.onAuthLogout = () => setUser(null)
    kc.onTokenExpired = () => {
      kc.updateToken(30).catch(() => kc.logout())
    }

    initKeycloak()
      .then((authenticated) => {
        if (cancelled) return
        if (authenticated) setUser(sessionUserFromKeycloak(kc))
        setInitializing(false)
      })
      .catch((error: unknown) => {
        // Keycloak unreachable / misconfigured: don't hang the app — drop to the
        // login screen so the user can retry sign-in.
        console.error("[auth] Keycloak init failed:", error)
        if (!cancelled) setInitializing(false)
      })

    return () => {
      cancelled = true
      kc.onAuthSuccess = undefined
      kc.onAuthRefreshSuccess = undefined
      kc.onAuthLogout = undefined
      kc.onTokenExpired = undefined
    }
  }, [])

  const login = React.useCallback((email?: string) => {
    keycloak?.login(email ? { loginHint: email } : undefined)
  }, [])

  const logout = React.useCallback(() => {
    keycloak?.logout({ redirectUri: `${window.location.origin}/login` })
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, login, logout, initializing, mode: "keycloak" }),
    [user, login, logout, initializing]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return isKeycloakConfigured ? (
    <KeycloakAuthProvider>{children}</KeycloakAuthProvider>
  ) : (
    <MockAuthProvider>{children}</MockAuthProvider>
  )
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
