import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { EntityCategory } from "@/data/types"
import { cn } from "@/lib/utils"

const CATEGORY_BADGE_CLASS: Record<EntityCategory, string> = {
  ministry: "bg-primary/10 text-primary border-primary/30 dark:text-primary",
  agency: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  enterprise:
    "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
}

export function ProviderCategoryBadge({
  category,
  className,
}: {
  category: EntityCategory
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Badge
      variant="outline"
      className={cn(CATEGORY_BADGE_CLASS[category], className)}
    >
      {t(`enums.providerCategory.${category}`)}
    </Badge>
  )
}
