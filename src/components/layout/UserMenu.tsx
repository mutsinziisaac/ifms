import { useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { initials } from "@/lib/format"
import { useAuth } from "@/auth/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    navigate("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              {initials(user?.name ?? "FO")}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">{t("topbar.userMenu.open")}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">
            {user?.name ?? t("topbar.userMenu.defaultName")}
          </p>
          <p className="text-xs text-muted-foreground">{user?.email ?? ""}</p>
          <p className="text-xs text-primary">
            {user?.role ?? t("topbar.userMenu.defaultRole")}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut />
          {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
