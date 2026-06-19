import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Braces } from "lucide-react"

import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/common/DataTable"
import { RelativeTime } from "@/components/common/RelativeTime"
import { VerificationBadge } from "@/components/common/status-badges"
import { Button } from "@/components/ui/button"
import type { ItmsVerificationStatus, Vehicle } from "@/data/types"
import { verificationRowAccent } from "@/lib/status"

import { VehiclePayloadDialog } from "./VehiclePayloadDialog"

const ALL = "all"

// The queue only carries vehicles that need attention, so the filter offers the
// two non-verified states (VERIFIED never appears here).
const QUEUE_VERIFICATION: ItmsVerificationStatus[] = ["NOT_FOUND", "UNVERIFIED"]

// Failed (NOT_FOUND) first, then unverified.
const VERIFICATION_RANK: Record<ItmsVerificationStatus, number> = {
  NOT_FOUND: 0,
  UNVERIFIED: 1,
  VERIFIED: 2,
}

export interface FleetVerificationTableProps {
  vehicles: Vehicle[]
  isLoading?: boolean
}

/**
 * Fleet verification queue table — renders only the fields the
 * `GET /vehicles?filter=verification` catalogue actually returns (plate,
 * provider, external id, ITMS verification, last updated). No
 * fabricated telemetry columns. The verification filter narrows the loaded
 * queue client-side; row click opens the vehicle detail page.
 */
export function FleetVerificationTable({
  vehicles,
  isLoading,
}: FleetVerificationTableProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [verificationFilter, setVerificationFilter] = useState(ALL)
  const [payloadVehicle, setPayloadVehicle] = useState<Vehicle | null>(null)

  const ordered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return vehicles
      .filter((v) => {
        if (
          verificationFilter !== ALL &&
          v.itmsVerificationStatus !== verificationFilter
        ) {
          return false
        }
        if (term !== "") {
          const haystack =
            `${v.plate} ${v.provider ?? ""} ${v.externalId ?? ""}`.toLowerCase()
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
  }, [vehicles, search, verificationFilter])

  const columns: DataTableColumn<Vehicle>[] = [
    {
      key: "plate",
      header: t("vehicles.table.plate"),
      render: (v) => (
        <div className="min-w-0">
          <div className="font-medium">{v.plate}</div>
          {v.externalId && (
            <div className="text-xs text-muted-foreground">{v.externalId}</div>
          )}
        </div>
      ),
    },
    {
      key: "provider",
      header: t("vehicles.table.provider"),
      render: (v) => (
        <span className="text-muted-foreground">{v.provider ?? "—"}</span>
      ),
    },
    {
      key: "verification",
      header: t("vehicles.table.verification"),
      render: (v) => <VerificationBadge status={v.itmsVerificationStatus} />,
    },
    {
      key: "lastUpdated",
      header: t("vehicles.table.lastUpdated"),
      render: (v) => (
        <RelativeTime iso={v.lastSyncAt} className="text-muted-foreground" />
      ),
    },
    {
      key: "payload",
      header: t("vehicles.table.payload"),
      className: "w-px text-right",
      render: (v) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("vehicles.payload.view")}
          title={t("vehicles.payload.view")}
          onClick={(e) => {
            // Don't let the row's navigate-to-detail handler fire.
            e.stopPropagation()
            setPayloadVehicle(v)
          }}
        >
          <Braces />
        </Button>
      ),
    },
  ]

  const filters: DataTableFilter[] = [
    {
      key: "verification",
      label: t("vehicles.filters.verification"),
      value: verificationFilter,
      onChange: setVerificationFilter,
      options: QUEUE_VERIFICATION.map((s) => ({
        value: s,
        label: t(`enums.itmsVerificationStatus.${s}`),
      })),
    },
  ]

  return (
    <>
      <DataTable
        data={ordered}
        columns={columns}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("vehicles.searchByPlateProvider")}
        filters={filters}
        rowClassName={verificationRowAccent}
        onRowClick={(v) => navigate(`/fleet/${v.id}`)}
        emptyTitle={t("vehicles.emptyTitle")}
        emptyDescription={t("vehicles.emptyDescription")}
      />
      <VehiclePayloadDialog
        vehicle={payloadVehicle}
        onOpenChange={(open) => {
          if (!open) setPayloadVehicle(null)
        }}
      />
    </>
  )
}
