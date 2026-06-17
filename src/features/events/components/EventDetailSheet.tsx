import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  Building2,
  Check,
  CircleCheckBig,
  Hexagon,
  MapPin,
  Waypoints,
  TriangleAlert,
  Truck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { RelativeTime } from "@/components/common/RelativeTime"
import {
  EventSeverityBadge,
  EventStatusBadge,
} from "@/components/common/status-badges"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/auth/auth-context"
import {
  useAcknowledgeEvent,
  useCloseEvent,
  useEntities,
  useEscalateEvent,
} from "@/data/hooks"
import { ESCALATION_TARGETS } from "@/data/types"
import type { FleetEvent } from "@/data/types"
import { formatCoords, formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

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

function TimelineStep({
  done,
  title,
  detail,
}: {
  done: boolean
  title: string
  detail?: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          "mt-1 grid size-4 shrink-0 place-items-center rounded-full border",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 bg-background"
        )}
      >
        {done ? <Check className="size-2.5" /> : null}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm",
            done ? "font-medium" : "text-muted-foreground"
          )}
        >
          {title}
        </p>
        {detail ? (
          <p className="text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </li>
  )
}

export interface EventDetailSheetProps {
  event: FleetEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
}: EventDetailSheetProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const entities = useEntities().data ?? []

  const acknowledge = useAcknowledgeEvent()
  const escalate = useEscalateEvent()
  const close = useCloseEvent()

  const [escalateOpen, setEscalateOpen] = useState(false)
  const [escalateTo, setEscalateTo] = useState<string>(ESCALATION_TARGETS[0])
  const [closeOpen, setCloseOpen] = useState(false)
  const [note, setNote] = useState("")

  // Reset the action dialogs whenever a different event is shown.
  useEffect(() => {
    setEscalateOpen(false)
    setCloseOpen(false)
    setNote("")
    setEscalateTo(ESCALATION_TARGETS[0])
  }, [event?.id])

  if (!event) return null

  const userName = user?.name ?? "Operator"
  const provider = entities.find((e) => e.id === event.entityId)
  const alerting = event.severity === "critical" && event.status === "open"

  const handleAcknowledge = () => {
    acknowledge.mutate(
      { id: event.id, by: userName },
      {
        onSuccess: () => toast.success(t("events.workflow.acknowledgeToast")),
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("events.workflow.acknowledgeError")
          ),
      }
    )
  }

  const handleEscalate = () => {
    escalate.mutate(
      { id: event.id, to: escalateTo, by: userName },
      {
        onSuccess: () => {
          toast.success(
            t("events.workflow.escalateToast", { target: escalateTo })
          )
          setEscalateOpen(false)
        },
        onError: (err) =>
          toast.error(
            err instanceof Error
              ? err.message
              : t("events.workflow.escalateError")
          ),
      }
    )
  }

  const handleClose = () => {
    if (note.trim().length === 0) {
      toast.error(t("events.workflow.noteRequired"))
      return
    }
    close.mutate(
      { id: event.id, by: userName, note: note.trim() },
      {
        onSuccess: () => {
          toast.success(t("events.workflow.closeToast"))
          setCloseOpen(false)
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("events.workflow.closeError")
          ),
      }
    )
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader
            className={cn(
              "space-y-2",
              alerting && "border-l-2 border-l-rose-500 bg-rose-500/5"
            )}
          >
            <div className="flex items-center gap-2">
              {alerting && (
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-500 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
                </span>
              )}
              <EventSeverityBadge severity={event.severity} />
              <EventStatusBadge status={event.status} />
            </div>
            <SheetTitle>{t(`enums.eventType.${event.type}`)}</SheetTitle>
            <SheetDescription>{event.message}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
            <div className="grid gap-4">
              <InfoRow icon={Truck} label={t("events.detail.vehicle")}>
                <Link
                  to={`/fleet/${event.vehicleId}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  {event.vehiclePlate}
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </InfoRow>
              <InfoRow icon={Building2} label={t("events.detail.provider")}>
                {provider?.name ?? "—"}
              </InfoRow>
              {event.geozoneName ? (
                <InfoRow icon={Hexagon} label={t("events.detail.geozone")}>
                  {event.geozoneName}
                </InfoRow>
              ) : null}
              {event.routeName ? (
                <InfoRow icon={Waypoints} label={t("events.detail.route")}>
                  {event.routeName}
                </InfoRow>
              ) : null}
              <InfoRow icon={MapPin} label={t("events.detail.location")}>
                <span className="font-mono text-xs tabular-nums">
                  {formatCoords(event.location)}
                </span>
              </InfoRow>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3 font-heading text-sm font-semibold">
                {t("events.detail.timelineTitle")}
              </h3>
              <ul className="space-y-3">
                <TimelineStep
                  done
                  title={t("events.detail.recorded")}
                  detail={
                    <>
                      {formatDateTime(event.at)} (
                      <RelativeTime iso={event.at} />)
                    </>
                  }
                />
                <TimelineStep
                  done={event.acknowledgedAt !== null}
                  title={t("events.detail.acknowledged")}
                  detail={
                    event.acknowledgedAt
                      ? t("events.detail.byAt", {
                          by: event.acknowledgedBy,
                          at: formatDateTime(event.acknowledgedAt),
                        })
                      : t("events.detail.awaitingReview")
                  }
                />
                {event.escalatedAt ? (
                  <TimelineStep
                    done
                    title={t("events.detail.escalated")}
                    detail={t("events.detail.escalatedTo", {
                      target: event.escalatedTo,
                      at: formatDateTime(event.escalatedAt),
                    })}
                  />
                ) : null}
                <TimelineStep
                  done={event.closedAt !== null}
                  title={t("events.detail.closed")}
                  detail={
                    event.closedAt
                      ? t("events.detail.byAt", {
                          by: event.closedBy,
                          at: formatDateTime(event.closedAt),
                        })
                      : t("events.detail.openForHandling")
                  }
                />
              </ul>
              {event.resolutionNote ? (
                <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("events.detail.resolutionNote")}
                  </p>
                  <p className="mt-1 text-sm">{event.resolutionNote}</p>
                </div>
              ) : null}
            </div>
          </div>

          {event.status !== "closed" ? (
            <div className="flex flex-wrap items-center gap-2 border-t p-4">
              {event.status === "open" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcknowledge}
                  disabled={acknowledge.isPending}
                >
                  <Check className="size-4" />
                  {t("events.workflow.acknowledge")}
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEscalateOpen(true)}
              >
                <TriangleAlert className="size-4" />
                {t("events.workflow.escalate")}
              </Button>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => setCloseOpen(true)}
              >
                <CircleCheckBig className="size-4" />
                {t("events.workflow.closeEvent")}
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <FormDialog
        open={escalateOpen}
        onOpenChange={setEscalateOpen}
        title={t("events.workflow.escalateTitle")}
        description={t("events.workflow.escalateDescription")}
        submitLabel={t("events.workflow.escalate")}
        onSubmit={handleEscalate}
        isPending={escalate.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="escalate-to">
            {t("events.workflow.escalateToLabel")}
          </Label>
          <Select value={escalateTo} onValueChange={setEscalateTo}>
            <SelectTrigger id="escalate-to" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESCALATION_TARGETS.map((target) => (
                <SelectItem key={target} value={target}>
                  {target}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormDialog>

      <FormDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={t("events.workflow.closeTitle")}
        description={t("events.workflow.closeDescription")}
        submitLabel={t("events.workflow.closeEvent")}
        onSubmit={handleClose}
        isPending={close.isPending}
        disabled={note.trim().length === 0}
      >
        <div className="space-y-2">
          <Label htmlFor="resolution-note">
            {t("events.workflow.resolutionNoteLabel")}
          </Label>
          <Textarea
            id="resolution-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("events.workflow.resolutionNotePlaceholder")}
            rows={4}
          />
        </div>
      </FormDialog>
    </>
  )
}
