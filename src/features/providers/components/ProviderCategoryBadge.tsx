import { Badge } from "@/components/ui/badge"
import type { EntityCategory } from "@/data/types"
import { cn } from "@/lib/utils"

const CATEGORY_CONFIG: Record<
  EntityCategory,
  { label: string; badgeClass: string }
> = {
  ministry: {
    label: "Ministry",
    badgeClass:
      "bg-primary/10 text-primary border-primary/30 dark:text-primary",
  },
  agency: {
    label: "Agency",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  enterprise: {
    label: "Enterprise",
    badgeClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
}

export function ProviderCategoryBadge({
  category,
  className,
}: {
  category: EntityCategory
  className?: string
}) {
  const config = CATEGORY_CONFIG[category]
  return (
    <Badge variant="outline" className={cn(config.badgeClass, className)}>
      {config.label}
    </Badge>
  )
}
