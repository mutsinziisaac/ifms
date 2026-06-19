import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Vehicle } from "@/data/types"

export interface VehiclePayloadDialogProps {
  /** The vehicle whose record to show; the dialog is open while this is set. */
  vehicle: Vehicle | null
  onOpenChange: (open: boolean) => void
}

/**
 * Read-only viewer for a vehicle's raw catalogue record, pretty-printed as JSON
 * with a copy-to-clipboard action. Opened from the Unverified Fleet queue.
 */
export function VehiclePayloadDialog({
  vehicle,
  onOpenChange,
}: VehiclePayloadDialogProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const json = vehicle ? JSON.stringify(vehicle, null, 2) : ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      toast.success(t("vehicles.payload.copied"))
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(t("vehicles.payload.copyFailed"))
    }
  }

  return (
    <Dialog open={vehicle !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("vehicles.payload.title")}</DialogTitle>
          <DialogDescription>
            {t("vehicles.payload.description", { plate: vehicle?.plate ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] rounded-lg border bg-muted/40">
          <pre className="p-4 text-xs leading-relaxed tabular-nums">
            <code>{json}</code>
          </pre>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {t("vehicles.payload.copy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
