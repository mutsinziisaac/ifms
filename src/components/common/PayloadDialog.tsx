import { useState } from "react"
import { Check, Copy } from "lucide-react"
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

export interface PayloadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Any JSON-serializable value; rendered pretty-printed. */
  data: unknown
  copyLabel: string
  copiedMessage: string
  copyFailedMessage: string
}

/**
 * Read-only viewer for a JSON-serializable record, pretty-printed with a
 * copy-to-clipboard action. i18n-free and fully parameterized so any feature can
 * reuse it (e.g. the Fleet verification queue and the Provider positions table).
 */
export function PayloadDialog({
  open,
  onOpenChange,
  title,
  description,
  data,
  copyLabel,
  copiedMessage,
  copyFailedMessage,
}: PayloadDialogProps) {
  const [copied, setCopied] = useState(false)
  const json = data != null ? JSON.stringify(data, null, 2) : ""

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      toast.success(copiedMessage)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(copyFailedMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] rounded-lg border bg-muted/40">
          <pre className="p-4 text-xs leading-relaxed tabular-nums">
            <code>{json}</code>
          </pre>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleCopy}>
            {copied ? <Check /> : <Copy />}
            {copyLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
