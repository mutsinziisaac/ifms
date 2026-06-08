import { useEffect, useState } from "react"

import { formatDateTime, formatRelativeTime } from "@/lib/format"

export function RelativeTime({
  iso,
  className,
}: {
  iso: string
  className?: string
}) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className={className} title={formatDateTime(iso)}>
      {formatRelativeTime(iso)}
    </span>
  )
}
