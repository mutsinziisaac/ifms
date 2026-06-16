import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { FormDialog } from "@/components/common/FormDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateWebUser,
  useEntities,
  useRoles,
  useUpdateWebUser,
} from "@/data/hooks"
import type { WebUserInput } from "@/data/api"
import type { WebUser, WebUserStatus } from "@/data/types"
import { WEB_USER_STATUSES } from "@/data/types"

interface UserFormState {
  name: string
  email: string
  roleId: string
  status: WebUserStatus
  phone: string
  entityId: string
}

function blankState(defaultRoleId: string): UserFormState {
  return {
    name: "",
    email: "",
    roleId: defaultRoleId,
    status: "active",
    phone: "",
    entityId: "",
  }
}

function fromUser(user: WebUser): UserFormState {
  return {
    name: user.name,
    email: user.email,
    roleId: user.roleId,
    status: user.status,
    phone: user.phone,
    entityId: user.entityId ?? "",
  }
}

export function AdminUserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: WebUser
}) {
  const { t } = useTranslation()
  const roles = useRoles().data ?? []
  const entities = useEntities().data ?? []
  const createUser = useCreateWebUser()
  const updateUser = useUpdateWebUser()
  const isEdit = Boolean(user)
  const firstRoleId = roles[0]?.id ?? ""

  const [form, setForm] = useState<UserFormState>(() =>
    user ? fromUser(user) : blankState("")
  )

  useEffect(() => {
    if (!open) return
    setForm(user ? fromUser(user) : blankState(firstRoleId))
  }, [open, user, firstRoleId])

  function patch<K extends keyof UserFormState>(
    key: K,
    value: UserFormState[K]
  ): void {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const isPending = createUser.isPending || updateUser.isPending
  const trimmedName = form.name.trim()
  const trimmedEmail = form.email.trim()
  const canSubmit =
    trimmedName.length > 0 && trimmedEmail.length > 0 && form.roleId.length > 0

  function handleSubmit(): void {
    if (!canSubmit) {
      toast.error(t("admin.users.toast.requiredFields"))
      return
    }
    const input: WebUserInput = {
      name: trimmedName,
      email: trimmedEmail,
      roleId: form.roleId,
      status: form.status,
      phone: form.phone.trim(),
      entityId: form.entityId || null,
    }
    if (isEdit && user) {
      updateUser.mutate(
        { id: user.id, patch: input },
        {
          onSuccess: () => {
            toast.success(t("admin.users.toast.saved"))
            onOpenChange(false)
          },
          onError: (err: unknown) =>
            toast.error(
              err instanceof Error ? err.message : t("admin.users.toast.error")
            ),
        }
      )
      return
    }
    createUser.mutate(input, {
      onSuccess: () => {
        toast.success(t("admin.users.toast.added", { name: trimmedName }))
        onOpenChange(false)
      },
      onError: (err: unknown) =>
        toast.error(
          err instanceof Error ? err.message : t("admin.users.toast.error")
        ),
    })
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t("admin.users.form.editTitle") : t("admin.users.form.addTitle")}
      description={
        isEdit
          ? t("admin.users.form.editDescription")
          : t("admin.users.form.addDescription")
      }
      submitLabel={isEdit ? t("admin.users.form.save") : t("admin.users.form.add")}
      onSubmit={handleSubmit}
      isPending={isPending}
      disabled={!canSubmit}
      widthClass="sm:max-w-2xl"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="user-name">{t("admin.users.form.name")}</Label>
          <Input
            id="user-name"
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="user-email">{t("admin.users.form.email")}</Label>
          <Input
            id="user-email"
            type="email"
            value={form.email}
            onChange={(e) => patch("email", e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("admin.users.form.role")}</Label>
          <Select value={form.roleId} onValueChange={(v) => patch("roleId", v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{t("admin.users.form.status")}</Label>
          <Select
            value={form.status}
            onValueChange={(v) => patch("status", v as WebUserStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEB_USER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`enums.webUserStatus.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-phone">{t("admin.users.form.phone")}</Label>
          <Input
            id="user-phone"
            value={form.phone}
            onChange={(e) => patch("phone", e.target.value)}
            placeholder="+251 91 234 5678"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("admin.users.form.entity")}</Label>
          <Select
            value={form.entityId || "none"}
            onValueChange={(v) => patch("entityId", v === "none" ? "" : v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("admin.users.form.noEntity")}</SelectItem>
              {entities.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.shortName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormDialog>
  )
}
