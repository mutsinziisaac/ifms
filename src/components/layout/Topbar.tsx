import { ChevronDown, Moon, Pause, Play, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { isRealApi } from "@/data/api"
import { useTheme } from "@/components/theme-provider"
import { useSimulation } from "@/sim/SimulationProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GlobalSearch } from "@/components/layout/GlobalSearch"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { NotificationsBell } from "@/components/layout/NotificationsBell"
import { UserMenu } from "@/components/layout/UserMenu"

const SPEED_OPTIONS = [1, 4, 16] as const

export function Topbar() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { paused, setPaused, speed, setSpeed } = useSimulation()

  // Resolve the concrete scheme ("system" follows the OS preference) so the
  // toggle shows the right icon and always flips to a concrete value.
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <GlobalSearch />

      <div className="flex-1" />

      <div className="flex items-center gap-2 rounded-full border py-1 pr-1 pl-2">
        <span
          className={cn(
            "size-2 rounded-full",
            paused ? "bg-muted-foreground" : "animate-pulse bg-emerald-500"
          )}
        />
        <span className="text-xs font-medium">
          {paused ? t("topbar.paused") : t("topbar.live")}
        </span>
        {/* Speed/pause drive the simulation only — hide them against the real
            backend, where the feed is genuinely live (polling + SSE). */}
        {!isRealApi && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="xs">
                  {speed}x
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-20">
                {SPEED_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onSelect={() => setSpeed(option)}
                  >
                    {option}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play /> : <Pause />}
              <span className="sr-only">
                {paused
                  ? t("topbar.resumeSimulation")
                  : t("topbar.pauseSimulation")}
              </span>
            </Button>
          </>
        )}
      </div>

      <NotificationsBell />

      <LanguageSwitcher />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        <span className="sr-only">{t("topbar.toggleTheme")}</span>
      </Button>

      <UserMenu />
    </header>
  )
}
