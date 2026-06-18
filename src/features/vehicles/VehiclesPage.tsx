import { useTranslation } from "react-i18next"
import { Building2, ListChecks, ShieldAlert, ShieldQuestion } from "lucide-react"

import { StatCard } from "@/components/common/StatCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { useVerificationVehicles } from "@/data/hooks"

import { FleetVerificationTable } from "./components/FleetVerificationTable"

export function VehiclesPage() {
  const { t } = useTranslation()

  // The Fleet page is the ITMS verification queue — vehicles the backend has
  // flagged for review (GET /vehicles?filter=verification). It shows only the
  // catalogue fields the endpoint returns; live telemetry lives on the map.
  const query = useVerificationVehicles()
  const vehicles = query.data ?? []

  const failedCount = vehicles.filter(
    (v) => v.itmsVerificationStatus === "NOT_FOUND"
  ).length
  const unverifiedCount = vehicles.filter(
    (v) => v.itmsVerificationStatus === "UNVERIFIED"
  ).length
  const providerCount = new Set(
    vehicles.map((v) => v.provider).filter(Boolean)
  ).size

  return (
    <div>
      <PageHeader
        title={t("vehicles.title")}
        description={t("vehicles.description")}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("vehicles.stats.inQueue")}
          value={vehicles.length}
          icon={ListChecks}
        />
        <StatCard
          label={t("vehicles.stats.verificationFailed")}
          value={failedCount}
          icon={ShieldAlert}
          intent="danger"
        />
        <StatCard
          label={t("vehicles.stats.unverified")}
          value={unverifiedCount}
          icon={ShieldQuestion}
          intent="warning"
        />
        <StatCard
          label={t("vehicles.stats.providers")}
          value={providerCount}
          icon={Building2}
        />
      </div>

      <FleetVerificationTable vehicles={vehicles} isLoading={query.isLoading} />
    </div>
  )
}
