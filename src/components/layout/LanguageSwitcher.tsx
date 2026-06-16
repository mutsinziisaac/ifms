import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/i18n"

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  am: "አማርኛ",
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = (i18n.resolvedLanguage ?? "en") as AppLanguage

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="size-4" />
          <span className="sr-only">{t("topbar.language")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuLabel>{t("topbar.language")}</DropdownMenuLabel>
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuCheckboxItem
            key={lng}
            checked={current === lng}
            onCheckedChange={() => void i18n.changeLanguage(lng)}
          >
            {LANGUAGE_LABELS[lng]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
