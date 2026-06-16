import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  CalendarDays,
  IdCard,
  Mail,
  Phone,
  ShieldAlert,
  Trash2,
  Truck,
  UserPen,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { EntityBadge } from "@/components/common/EntityBadge"
import { DriverStatusBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeleteDriver, useDriver, useEntities } from "@/data/hooks"
import type { Driver } from "@/data/types"
import { daysUntil, formatDate, fullName } from "@/lib/format"
import { cn } from "@/lib/utils"

import { AssignVehicleDialog } from "./components/AssignVehicleDialog"
import { DriverFormDialog } from "./components/DriverFormDialog"
import { DriverSafetyPanel } from "./components/DriverSafetyPanel"

const EXPIRY_SOON_DAYS = 60

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium break-words">{children}</div>
      </div>
    </div>
  )
}

function ProfileCard({ driver }: { driver: Driver }) {
  const { t } = useTranslation()
  const entities = useEntities().data ?? []
  const entityName =
    entities.find((e) => e.id === driver.entityId)?.shortName ?? "—"

  const days = daysUntil(driver.licenseExpiry)
  const expired = days < 0
  const soon = days >= 0 && days < EXPIRY_SOON_DAYS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{t("drivers.detail.profile.title")}</span>
          <DriverStatusBadge status={driver.status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InfoRow icon={Phone} label={t("drivers.detail.profile.phone")}>
            {driver.phone || "—"}
          </InfoRow>
          <InfoRow icon={Mail} label={t("drivers.detail.profile.email")}>
            {driver.email || "—"}
          </InfoRow>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InfoRow icon={IdCard} label={t("drivers.detail.profile.license")}>
            <span className="tabular-nums">{driver.licenseNo}</span>
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              {driver.licenseCategory}
            </span>
          </InfoRow>
          <InfoRow
            icon={CalendarDays}
            label={t("drivers.detail.profile.licenseExpiry")}
          >
            <span className="tabular-nums">
              {formatDate(driver.licenseExpiry)}
            </span>
            {(expired || soon) && (
              <span
                className={cn(
                  "ml-2 text-xs font-medium",
                  expired
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {expired
                  ? t("drivers.license.expiredAgo", { count: -days })
                  : t("drivers.license.inDays", { count: days })}
              </span>
            )}
          </InfoRow>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InfoRow icon={Truck} label={t("drivers.detail.profile.entity")}>
            <EntityBadge name={entityName} />
          </InfoRow>
          <InfoRow
            icon={CalendarDays}
            label={t("drivers.detail.profile.hireDate")}
          >
            <span className="tabular-nums">{formatDate(driver.hireDate)}</span>
          </InfoRow>
        </div>

        <Separator />

        <InfoRow
          icon={ShieldAlert}
          label={t("drivers.detail.profile.emergencyContact")}
        >
          {driver.emergencyContactName ? (
            <span>
              {driver.emergencyContactName}
              {driver.emergencyContactPhone ? (
                <span className="ml-2 font-normal text-muted-foreground tabular-nums">
                  {driver.emergencyContactPhone}
                </span>
              ) : null}
            </span>
          ) : (
            <span className="font-normal text-muted-foreground">
              {t("drivers.detail.profile.notProvided")}
            </span>
          )}
        </InfoRow>
      </CardContent>
    </Card>
  )
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

export function DriverDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const driverQuery = useDriver(id)
  const deleteDriver = useDeleteDriver()

  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const driver = driverQuery.data ?? null

  function handleDelete(): void {
    if (!driver) return
    deleteDriver.mutate(driver.id, {
      onSuccess: () => {
        toast.success(t("drivers.toast.removed", { name: fullName(driver) }))
        setDeleteOpen(false)
        navigate("/drivers")
      },
      onError: (err: unknown) =>
        toast.error(
          err instanceof Error ? err.message : t("drivers.toast.deleteError")
        ),
    })
  }

  if (driverQuery.isLoading) {
    return (
      <div>
        <PageHeader title={t("drivers.detail.driver")} />
        <DetailSkeleton />
      </div>
    )
  }

  if (!driver) {
    return (
      <div>
        <PageHeader
          title={t("drivers.detail.notFoundTitle")}
          description={t("drivers.detail.notFoundDescription")}
          actions={
            <Button variant="outline" asChild>
              <Link to="/drivers">
                <ArrowLeft className="size-4" />
                {t("drivers.detail.backToDrivers")}
              </Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={fullName(driver)}
        description={t("drivers.detail.subtitle", {
          license: driver.licenseNo,
          category: driver.licenseCategory,
        })}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <UserPen className="size-4" />
              {t("common.edit")}
            </Button>
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <Truck className="size-4" />
              {t("drivers.detail.assignVehicle")}
            </Button>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ProfileCard driver={driver} />
        <DriverSafetyPanel driver={driver} />
      </div>

      <DriverFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        driver={driver}
      />
      <AssignVehicleDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        driver={driver}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("drivers.detail.deleteTitle")}
        description={t("drivers.detail.deleteDescription", {
          name: fullName(driver),
        })}
        confirmLabel={t("drivers.detail.deleteConfirm")}
        destructive
        onConfirm={handleDelete}
        isPending={deleteDriver.isPending}
      />
    </div>
  )
}
