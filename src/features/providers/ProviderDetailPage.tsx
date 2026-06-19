import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  Hash,
  Truck,
  XCircle,
} from "lucide-react"

import { EmptyState } from "@/components/common/EmptyState"
import { RelativeTime } from "@/components/common/RelativeTime"
import { StatCard } from "@/components/common/StatCard"
import { EventSeverityBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEvents, useProviderPositions, useProviders } from "@/data/hooks"

import { ProviderFleetTable } from "./components/ProviderFleetTable"

const MAX_RECENT_EVENTS = 6

export function ProviderDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const providersQuery = useProviders()
  const events = useEvents().data ?? []

  const provider = (providersQuery.data ?? []).find((p) => p.id === id)
  const code = provider?.code

  // No backend endpoint lists a provider's vehicles, so the fleet table renders
  // seeded dummy positions — sized to the submitted tally and distributed across
  // verified/unverified/notFound to match the stat cards. See provider-positions.ts.
  const positionsQuery = useProviderPositions(code, provider?.vehicleStats)

  const recentEvents = useMemo(
    () => events.filter((e) => e.entityId === id).slice(0, MAX_RECENT_EVENTS),
    [events, id]
  )

  if (!providersQuery.isLoading && !provider) {
    return (
      <EmptyState
        icon={Building2}
        title={t("providers.detail.notFoundTitle")}
        description={t("providers.detail.notFoundDescription")}
        action={
          <Button onClick={() => navigate("/providers")}>
            <ArrowLeft className="size-4" />
            {t("providers.detail.backToProviders")}
          </Button>
        }
      />
    )
  }

  if (!provider) return null

  const vs = provider.vehicleStats

  return (
    <div>
      <PageHeader
        title={provider.code}
        actions={
          <Button variant="outline" onClick={() => navigate("/providers")}>
            <ArrowLeft className="size-4" />
            {t("providers.detail.allProviders")}
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Badge variant={provider.active ? "default" : "secondary"}>
            {provider.active ? t("providers.active") : t("providers.inactive")}
          </Badge>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Hash className="size-3.5" />
            {provider.id}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {t("providers.detail.added")}{" "}
            <RelativeTime iso={provider.createdAt} />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {t("providers.detail.updated")}{" "}
            <RelativeTime iso={provider.modifiedAt} />
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("providers.detail.stats.submitted")}
            value={vs.submitted}
            icon={Truck}
            hint={t("providers.detail.stats.submittedHint")}
          />
          <StatCard
            label={t("providers.detail.stats.verified")}
            value={vs.verified}
            icon={CheckCircle2}
            intent={vs.verified > 0 ? "success" : undefined}
            hint={t("providers.detail.stats.verifiedHint")}
          />
          <StatCard
            label={t("providers.detail.stats.unverified")}
            value={vs.unverified}
            icon={Clock3}
            intent={vs.unverified > 0 ? "warning" : "success"}
            hint={t("providers.detail.stats.unverifiedHint")}
          />
          <StatCard
            label={t("providers.detail.stats.notFound")}
            value={vs.notFound}
            icon={XCircle}
            intent={vs.notFound > 0 ? "danger" : undefined}
            hint={t("providers.detail.stats.notFoundHint")}
          />
        </div>

        <Card className="gap-0">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>{t("providers.detail.events.title")}</CardTitle>
            <Link
              to={`/events?entity=${provider.id}`}
              className="flex items-center gap-0.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t("providers.detail.events.viewAll")}
              <ChevronRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-2">
            {recentEvents.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                {t("providers.detail.events.empty")}
              </p>
            ) : (
              <ul className="divide-y">
                {recentEvents.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {t(`enums.eventType.${event.type}`)} ·{" "}
                        {event.vehiclePlate}
                      </p>
                      <RelativeTime
                        iso={event.at}
                        className="text-xs text-muted-foreground"
                      />
                    </div>
                    <EventSeverityBadge severity={event.severity} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <ProviderFleetTable
          positions={positionsQuery.data ?? []}
          isLoading={positionsQuery.isLoading}
        />
      </div>
    </div>
  )
}
