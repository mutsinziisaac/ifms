import * as React from "react"
import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/auth-context"
import { Spinner } from "@/components/ui/spinner"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  // Wait for Keycloak's SSO check before deciding to redirect (mock auth is
  // synchronous, so this never blocks there).
  if (initializing) {
    return (
      <div className="grid min-h-svh place-items-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
