import { useEffect, useState } from "react"
import { Check, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { FormDialog } from "@/components/common/FormDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  useCreateGeozoneGroup,
  useDeleteGeozoneGroup,
  useUpdateGeozoneGroup,
} from "@/data/hooks"
import type { GeozoneGroup } from "@/data/types"
import { GEOZONE_GROUP_COLORS } from "@/lib/geozone-colors"
import { cn } from "@/lib/utils"

export interface GeozoneGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: GeozoneGroup
}

export function GeozoneGroupDialog({
  open,
  onOpenChange,
  group,
}: GeozoneGroupDialogProps) {
  const isEdit = group !== undefined

  const [name, setName] = useState("")
  const [color, setColor] = useState<string>(GEOZONE_GROUP_COLORS[0])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const createGroup = useCreateGeozoneGroup()
  const updateGroup = useUpdateGeozoneGroup()
  const deleteGroup = useDeleteGeozoneGroup()

  // Reset fields whenever the dialog opens for a new target.
  useEffect(() => {
    if (!open) return
    setName(group?.name ?? "")
    setColor(group?.color ?? GEOZONE_GROUP_COLORS[0])
  }, [open, group])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error("Group name is required")
      return
    }
    if (isEdit && group) {
      updateGroup.mutate(
        { id: group.id, patch: { name: trimmed, color } },
        {
          onSuccess: () => {
            toast.success("Group updated")
            onOpenChange(false)
          },
          onError: () => toast.error("Could not update group"),
        }
      )
    } else {
      createGroup.mutate(
        { name: trimmed, color },
        {
          onSuccess: () => {
            toast.success("Group created")
            onOpenChange(false)
          },
          onError: () => toast.error("Could not create group"),
        }
      )
    }
  }

  const handleDelete = () => {
    if (!group) return
    deleteGroup.mutate(group.id, {
      onSuccess: () => {
        toast.success("Group deleted")
        setConfirmOpen(false)
        onOpenChange(false)
      },
      onError: () => toast.error("Could not delete group"),
    })
  }

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? "Edit group" : "New geozone group"}
        description="Groups colour-code related geozones on the map."
        submitLabel={isEdit ? "Save group" : "Create group"}
        onSubmit={handleSubmit}
        isPending={createGroup.isPending || updateGroup.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="group-name">Name</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Customs Yards"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>Colour</Label>
          <div className="flex flex-wrap gap-2">
            {GEOZONE_GROUP_COLORS.map((swatch) => {
              const active = swatch === color
              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  aria-label={`Colour ${swatch}`}
                  className={cn(
                    "grid size-8 place-items-center rounded-lg ring-offset-2 ring-offset-background transition-transform hover:scale-105",
                    active && "ring-2 ring-ring"
                  )}
                  style={{ backgroundColor: swatch }}
                >
                  {active ? (
                    <span className="grid size-5 place-items-center rounded-full bg-white shadow ring-1 ring-black/10">
                      <Check className="size-3.5 text-neutral-900" />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        {isEdit ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="w-full"
          >
            <Trash2 className="size-4" />
            Delete group
          </Button>
        ) : null}
      </FormDialog>

      {isEdit && group ? (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete group?"
          description={`"${group.name}" will be removed. Geozones in this group keep their geometry but become ungrouped.`}
          confirmLabel="Delete group"
          destructive
          onConfirm={handleDelete}
          isPending={deleteGroup.isPending}
        />
      ) : null}
    </>
  )
}
