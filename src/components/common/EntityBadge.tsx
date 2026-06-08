import { Building2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function EntityBadge({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal", className)}>
      <Building2 className="size-3" />
      <span className="max-w-44 truncate">{name}</span>
    </Badge>
  )
}
