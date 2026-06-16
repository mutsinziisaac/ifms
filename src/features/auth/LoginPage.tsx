import * as React from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { LogIn, Truck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LocationState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { t } = useTranslation()
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const email = (
      form.elements.namedItem("email") as HTMLInputElement | null
    )?.value.trim()
    login(email && email.length > 0 ? email : "officer@motl.gov.et")
    const state = location.state as LocationState | null
    navigate(state?.from?.pathname ?? "/", { replace: true })
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 ring-1 ring-primary/40">
              <Truck className="size-6 text-white" />
            </div>
            <div>
              <p className="font-heading text-xl leading-none font-bold">
                {t("nav.brand")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("auth.brandSubtitle")}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-semibold">
              {t("auth.signInTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("auth.ministryLine")}
            </p>
          </div>

          <Card className="space-y-4 p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.workEmail")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue="officer@motl.gov.et"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t("auth.passwordPlaceholder")}
                />
              </div>
              <Button type="submit" className="w-full">
                <LogIn className="size-4" />
                {t("auth.signIn")}
              </Button>
            </form>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            {t("auth.demoNotice")}
          </p>
        </div>
      </div>

      <div className="relative hidden flex-col justify-end overflow-hidden bg-gradient-to-br from-[oklch(0.27_0.06_155)] via-[oklch(0.22_0.05_155)] to-[oklch(0.18_0.012_145)] p-12 lg:flex">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(oklch(1 0 0 / 0.08) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-[oklch(0.77_0.15_75)]/20 blur-3xl" />

        <div className="relative space-y-6 text-white">
          <span className="w-fit rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
            {t("auth.hero.badge")}
          </span>
          <h2 className="font-heading text-3xl leading-tight font-semibold">
            {t("auth.hero.title")}
          </h2>
          <p className="max-w-md text-sm text-white/70">
            {t("auth.hero.description")}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xl font-semibold">48</p>
              <p className="text-[11px] text-white/60">
                {t("auth.hero.vehiclesMonitored")}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xl font-semibold">9</p>
              <p className="text-[11px] text-white/60">
                {t("auth.hero.operatingEntities")}
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xl font-semibold">1,000+ km</p>
              <p className="text-[11px] text-white/60">
                {t("auth.hero.corridorCoverage")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
