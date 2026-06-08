import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel?: string
  onSubmit: () => void
  isPending?: boolean
  disabled?: boolean
  children: React.ReactNode
  widthClass?: string
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  onSubmit,
  isPending,
  disabled,
  children,
  widthClass,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto",
          widthClass ?? "sm:max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description != null && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <form
          className="space-y-4 pt-2"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          {children}
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || disabled}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {submitLabel ?? "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
