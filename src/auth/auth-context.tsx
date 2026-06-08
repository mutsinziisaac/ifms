/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import type { SessionUser } from "@/data/types"

const STORAGE_KEY = "ifms.auth"
const DEFAULT_ROLE = "Fleet Operations Officer"

interface AuthContextValue {
  user: SessionUser | null
  login: (email: string) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(() =>
    readStoredUser()
  )

  const login = React.useCallback((email: string) => {
    const next: SessionUser = {
      name: nameFromEmail(email),
      email,
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
    () => ({ user, login, logout }),
    [user, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
