import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Braces } from "lucide-react"

import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/common/DataTable"
import { PayloadDialog } from "@/components/common/PayloadDialog"
import { RelativeTime } from "@/components/common/RelativeTime"
import {
  VehicleStatusBadge,
  VerificationBadge,
} from "@/components/common/status-badges"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
  ItmsVerificationStatus,
  VehiclePosition,
  VehicleStatus,
} from "@/data/types"
import { formatKm, formatSpeed } from "@/lib/format"
import { verificationRowAccent } from "@/lib/status"

const ALL = "all"

// The four movement states a position report can carry (see POSITION_MOVEMENT_MAP
// in mappers.ts) — `ignition_blocked` never appears on this feed.
const POSITION_STATUSES: VehicleStatus[] = [
  "moving",
  "idling",
  "ignition_off",
  "no_signal",
]

const VERIFICATION_STATUSES: ItmsVerificationStatus[] = [
  "VERIFIED",
  "UNVERIFIED",
  "NOT_FOUND",
]

// Failed (NOT_FOUND) first, then unverified, then verified — surfaces the
// vehicles needing attention at the top of the list.
const VERIFICATION_RANK: Record<ItmsVerificationStatus, number> = {
  NOT_FOUND: 0,
  UNVERIFIED: 1,
  VERIFIED: 2,
}

const COMPASS = [
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
] as const

/** Heading degrees → "NE · 45°". */
function formatHeading(deg: number): string {
  const point = COMPASS[Math.round(deg / 45) % 8]
  return `${point} · ${Math.round(deg)}°`
}

export interface ProviderFleetTableProps {
  positions: VehiclePosition[]
  isLoading?: boolean
}

/**
 * The provider's vehicle fleet, rendered from its latest position reports (dummy
 * data — see src/data/provider-positions.ts). The list is ordered failed-first by
 * ITMS verification; search narrows by plate or device IMEI; the verification and
 * movement filters narrow by status; the JSON button opens the raw position
 * payload.
 */
export function ProviderFleetTable({
  positions,
  isLoading,
}: ProviderFleetTableProps) {
  const { t } = useTranslation()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [verificationFilter, setVerificationFilter] = useState(ALL)
  const [payload, setPayload] = useState<VehiclePosition | null>(null)

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return positions
      .filter((p) => {
        if (statusFilter !== ALL && p.movementStatus !== statusFilter) {
          return false
        }
        if (
          verificationFilter !== ALL &&
          p.itmsVerificationStatus !== verificationFilter
        ) {
          return false
        }
        if (term !== "") {
          const haystack = `${p.plate} ${p.deviceImei}`.toLowerCase()
          if (!haystack.includes(term)) return false
        }
        return true
      })
      .sort((a, b) => {
        const rank =
          VERIFICATION_RANK[a.itmsVerificationStatus] -
          VERIFICATION_RANK[b.itmsVerificationStatus]
        return rank !== 0 ? rank : a.plate.localeCompare(b.plate)
      })
  }, [positions, search, statusFilter, verificationFilter])

  const columns: DataTableColumn<VehiclePosition>[] = [
    {
      key: "plate",
      header: t("providers.detail.fleet.plate"),
      render: (p) => (
        <span className="font-mono text-sm font-medium tabular-nums">
          {p.plate}
        </span>
      ),
    },
    {
      key: "verification",
      header: t("providers.detail.fleet.verification"),
      render: (p) => <VerificationBadge status={p.itmsVerificationStatus} />,
    },
    {
      key: "status",
      header: t("providers.detail.fleet.status"),
      render: (p) => <VehicleStatusBadge status={p.movementStatus} />,
    },
    {
      key: "speed",
      header: t("providers.detail.fleet.speed"),
      render: (p) => (
        <span className="text-sm tabular-nums">{formatSpeed(p.speedKmh)}</span>
      ),
    },
    {
      key: "heading",
      header: t("providers.detail.fleet.heading"),
      render: (p) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatHeading(p.heading)}
        </span>
      ),
    },
    {
      key: "ignition",
      header: t("providers.detail.fleet.ignition"),
      render: (p) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-sm",
            p.ignitionOn
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              p.ignitionOn ? "bg-emerald-500" : "bg-muted-foreground/50"
            )}
          />
          {p.ignitionOn
            ? t("providers.detail.fleet.ignitionOn")
            : t("providers.detail.fleet.ignitionOff")}
        </span>
      ),
    },
    {
      key: "odometer",
      header: t("providers.detail.fleet.odometer"),
      render: (p) => (
        <span className="text-sm tabular-nums">{formatKm(p.odometerKm)}</span>
      ),
    },
    {
      key: "recorded",
      header: t("providers.detail.fleet.recorded"),
      render: (p) => (
        <RelativeTime
          iso={p.recordedAt}
          className="text-sm text-muted-foreground"
        />
      ),
    },
    {
      key: "payload",
      header: t("providers.detail.fleet.payload"),
      className: "w-px text-right",
      render: (p) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("providers.detail.payload.view")}
          title={t("providers.detail.payload.view")}
          onClick={() => setPayload(p)}
        >
          <Braces />
        </Button>
      ),
    },
  ]

  const filters: DataTableFilter[] = [
    {
      key: "verification",
      label: t("providers.detail.fleet.verification"),
      value: verificationFilter,
      onChange: setVerificationFilter,
      options: VERIFICATION_STATUSES.map((s) => ({
        value: s,
        label: t(`enums.itmsVerificationStatus.${s}`),
      })),
    },
    {
      key: "status",
      label: t("providers.detail.fleet.status"),
      value: statusFilter,
      onChange: setStatusFilter,
      options: POSITION_STATUSES.map((s) => ({
        value: s,
        label: t(`enums.vehicleStatus.${s}`),
      })),
    },
  ]

  return (
    <>
      <DataTable
        data={rows}
        columns={columns}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("providers.detail.fleet.searchPlaceholder")}
        filters={filters}
        rowClassName={verificationRowAccent}
        emptyTitle={t("providers.detail.fleet.emptyTitle")}
        emptyDescription={t("providers.detail.fleet.emptyDescription")}
      />
      <PayloadDialog
        open={payload !== null}
        onOpenChange={(open) => {
          if (!open) setPayload(null)
        }}
        title={t("providers.detail.payload.title")}
        description={t("providers.detail.payload.description", {
          plate: payload?.plate ?? "",
        })}
        data={payload}
        copyLabel={t("providers.detail.payload.copy")}
        copiedMessage={t("providers.detail.payload.copied")}
        copyFailedMessage={t("providers.detail.payload.copyFailed")}
      />
    </>
  )
}
