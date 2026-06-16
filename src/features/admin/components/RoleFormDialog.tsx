import { Fragment, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateRole, useUpdateRole } from "@/data/hooks"
import type { RoleInput } from "@/data/api"
import type { Permission, Role, RoleType } from "@/data/types"
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  ROLE_TYPES,
} from "@/data/types"

const permKey = (module: string, action: string): Permission =>
  `${module}:${action}` as Permission

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role
}) {
  const { t } = useTranslation()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const isEdit = Boolean(role)

  const [name, setName] = useState("")
  const [type, setType] = useState<RoleType>("fms")
  const [description, setDescription] = useState("")
  const [perms, setPerms] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setName(role?.name ?? "")
    setType(role?.type ?? "fms")
    setDescription(role?.description ?? "")
    setPerms(new Set(role?.permissions ?? []))
  }, [open, role])

  function toggle(module: string, action: string) {
    const key = permKey(module, action)
    setPerms((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function rowAllChecked(module: string): boolean {
    return PERMISSION_ACTIONS.every((a) => perms.has(permKey(module, a)))
  }

  function toggleRow(module: string) {
    const all = rowAllChecked(module)
    setPerms((prev) => {
      const next = new Set(prev)
      for (const a of PERMISSION_ACTIONS) {
        const key = permKey(module, a)
        if (all) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }

  const isPending = createRole.isPending || updateRole.isPending
  const trimmedName = name.trim()
  const canSubmit = trimmedName.length > 0

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `minmax(7rem,1fr) 3rem repeat(${PERMISSION_ACTIONS.length}, 3rem)`,
    }),
    []
  )

  function handleSubmit() {
    if (!canSubmit) {
      toast.error(t("admin.roles.toast.requiredFields"))
      return
    }
    const input: RoleInput = {
      name: trimmedName,
      type,
      description: description.trim(),
      permissions: [...perms] as Permission[],
    }
    if (isEdit && role) {
      updateRole.mutate(
        { id: role.id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("admin.roles.toast.saved"))
            onOpenChange(false)
          },
          onError: (err: unknown) =>
            toast.error(
              err instanceof Error ? err.message : t("admin.roles.toast.error")
            ),
        }
      )
      return
    }
    createRole.mutate(input, {
      onSuccess: () => {
        toast.success(t("admin.roles.toast.added", { name: trimmedName }))
        onOpenChange(false)
      },
      onError: (err: unknown) =>
        toast.error(
          err instanceof Error ? err.message : t("admin.roles.toast.error")
        ),
    })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("admin.roles.form.editTitle") : t("admin.roles.form.addTitle")}
      description={
        isEdit
          ? t("admin.roles.form.editDescription")
          : t("admin.roles.form.addDescription")
      }
      submitLabel={isEdit ? t("admin.roles.form.save") : t("admin.roles.form.add")}
      onSubmit={handleSubmit}
      isPending={isPending}
      disabled={!canSubmit}
      widthClass="sm:max-w-3xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="role-name">{t("admin.roles.form.name")}</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("admin.roles.form.type")}</Label>
          <Select value={type} onValueChange={(v) => setType(v as RoleType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_TYPES.map((rt) => (
                <SelectItem key={rt} value={rt}>
                  {t(`enums.roleType.${rt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role-desc">{t("admin.roles.form.descriptionLabel")}</Label>
        <Textarea
          id="role-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("admin.roles.form.descriptionPlaceholder")}
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("admin.roles.form.permissions")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("admin.roles.form.permissionsHint")}
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <div className="grid min-w-md items-center gap-y-1 p-3" style={gridStyle}>
            <div className="text-xs text-muted-foreground">
              {t("admin.roles.form.moduleColumn")}
            </div>
            <div className="text-center text-[10px] text-muted-foreground">
              {t("admin.roles.form.selectRow")}
            </div>
            {PERMISSION_ACTIONS.map((a) => (
              <div
                key={a}
                className="text-center text-[10px] text-muted-foreground"
              >
                {t(`admin.permissionActions.${a}`)}
              </div>
            ))}

            {PERMISSION_MODULES.map((m) => (
              <Fragment key={m}>
                <div className="py-1 text-sm font-medium">
                  {t(`admin.modules.${m}`)}
                </div>
                <div className="flex justify-center">
                  <Checkbox
                    checked={rowAllChecked(m)}
                    onCheckedChange={() => toggleRow(m)}
                  />
                </div>
                {PERMISSION_ACTIONS.map((a) => (
                  <div key={a} className="flex justify-center">
                    <Checkbox
                      checked={perms.has(permKey(m, a))}
                      onCheckedChange={() => toggle(m, a)}
                    />
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </FormDialog>
  )
}
