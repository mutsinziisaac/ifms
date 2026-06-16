import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
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
      toast.error(t("geozones.toast.groupNameRequired"))
      return
    }
    if (isEdit && group) {
      updateGroup.mutate(
        { id: group.id, patch: { name: trimmed, color } },
        {
          onSuccess: () => {
            toast.success(t("geozones.toast.groupUpdated"))
            onOpenChange(false)
          },
          onError: () => toast.error(t("geozones.toast.groupUpdateFailed")),
        }
      )
    } else {
      createGroup.mutate(
        { name: trimmed, color },
        {
          onSuccess: () => {
            toast.success(t("geozones.toast.groupCreated"))
            onOpenChange(false)
          },
          onError: () => toast.error(t("geozones.toast.groupCreateFailed")),
        }
      )
    }
  }

  const handleDelete = () => {
    if (!group) return
    deleteGroup.mutate(group.id, {
      onSuccess: () => {
        toast.success(t("geozones.toast.groupDeleted"))
        setConfirmOpen(false)
        onOpenChange(false)
      },
      onError: () => toast.error(t("geozones.toast.groupDeleteFailed")),
    })
  }

  return (
    <>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={
          isEdit ? t("geozones.group.editTitle") : t("geozones.group.addTitle")
        }
        description={t("geozones.group.description")}
        submitLabel={
          isEdit
            ? t("geozones.group.saveGroup")
            : t("geozones.group.createGroup")
        }
        onSubmit={handleSubmit}
        isPending={createGroup.isPending || updateGroup.isPending}
      >
        <div className="space-y-2">
          <Label htmlFor="group-name">{t("forms.name")}</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("geozones.group.namePlaceholder")}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>{t("geozones.group.colour")}</Label>
          <div className="flex flex-wrap gap-2">
            {GEOZONE_GROUP_COLORS.map((swatch) => {
              const active = swatch === color
              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  aria-label={t("geozones.group.colourSwatch", { swatch })}
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
            {t("geozones.group.deleteGroup")}
          </Button>
        ) : null}
      </FormDialog>

      {isEdit && group ? (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t("geozones.group.deleteTitle")}
          description={t("geozones.group.deleteDescription", {
            name: group.name,
          })}
          confirmLabel={t("geozones.group.deleteConfirm")}
          destructive
          onConfirm={handleDelete}
          isPending={deleteGroup.isPending}
        />
      ) : null}
    </>
  )
}
