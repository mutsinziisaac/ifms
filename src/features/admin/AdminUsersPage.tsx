import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { EntityBadge } from "@/components/common/EntityBadge"
import { RelativeTime } from "@/components/common/RelativeTime"
import { WebUserStatusBadge } from "@/components/common/status-badges"
import { PageHeader } from "@/components/layout/PageHeader"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  useDeleteWebUser,
  useEntities,
  useRoles,
  useWebUsers,
} from "@/data/hooks"
import type { WebUser, WebUserStatus } from "@/data/types"
import { WEB_USER_STATUSES } from "@/data/types"
import { initials } from "@/lib/format"

import { AdminUserFormDialog } from "./components/AdminUserFormDialog"

export function AdminUsersPage() {
  const { t } = useTranslation()
  const usersQuery = useWebUsers()
  const roles = useRoles().data ?? []
  const entities = useEntities().data ?? []
  const deleteUser = useDeleteWebUser()

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<WebUserStatus | "all">("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<WebUser | null>(null)
  const [deleting, setDeleting] = useState<WebUser | null>(null)

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of roles) map.set(r.id, r.name)
    return map
  }, [roles])

  const entityShortById = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of entities) map.set(e.id, e.shortName)
    return map
  }, [entities])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return users.filter((u) => {
      if (needle) {
        const hay = `${u.name} ${u.email}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      if (roleFilter !== "all" && u.roleId !== roleFilter) return false
      if (statusFilter !== "all" && u.status !== statusFilter) return false
      return true
    })
  }, [users, search, roleFilter, statusFilter])

  const columns: DataTableColumn<WebUser>[] = [
    {
      key: "name",
      header: t("admin.users.table.name"),
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">
              {initials(u.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{u.name}</p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: t("admin.users.table.role"),
      render: (u) => (
        <Badge variant="outline" className="font-normal">
          {roleNameById.get(u.roleId) ?? t("admin.users.table.unknownRole")}
        </Badge>
      ),
    },
    {
      key: "entity",
      header: t("admin.users.table.entity"),
      render: (u) =>
        u.entityId ? (
          <EntityBadge name={entityShortById.get(u.entityId) ?? "—"} />
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("admin.users.form.noEntity")}
          </span>
        ),
    },
    {
      key: "status",
      header: t("admin.users.table.status"),
      render: (u) => <WebUserStatusBadge status={u.status} />,
    },
    {
      key: "lastLogin",
      header: t("admin.users.table.lastLogin"),
      render: (u) =>
        u.lastLoginAt ? (
          <RelativeTime
            iso={u.lastLoginAt}
            className="text-sm text-muted-foreground"
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("admin.users.table.never")}
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (u) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setEditing(u)
            }}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("admin.users.actions.edit")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeleting(u)
            }}
          >
            <Trash2 className="size-4 text-rose-500" />
            <span className="sr-only">{t("admin.users.actions.delete")}</span>
          </Button>
        </div>
      ),
    },
  ]

  function handleDelete() {
    if (!deleting) return
    deleteUser.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("admin.users.toast.deleted"))
        setDeleting(null)
      },
      onError: (err: unknown) =>
        toast.error(
          err instanceof Error ? err.message : t("admin.users.toast.error")
        ),
    })
  }

  return (
    <div>
      <PageHeader
        title={t("admin.users.title")}
        description={t("admin.users.description")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("admin.users.addButton")}
          </Button>
        }
      />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={usersQuery.isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("admin.users.table.searchPlaceholder")}
        onRowClick={(u) => setEditing(u)}
        filters={[
          {
            key: "role",
            label: t("admin.users.filters.role"),
            value: roleFilter,
            onChange: setRoleFilter,
            options: roles.map((r) => ({ value: r.id, label: r.name })),
          },
          {
            key: "status",
            label: t("admin.users.filters.status"),
            value: statusFilter,
            onChange: (v) => setStatusFilter(v as WebUserStatus | "all"),
            options: WEB_USER_STATUSES.map((s) => ({
              value: s,
              label: t(`enums.webUserStatus.${s}`),
            })),
          },
        ]}
        emptyTitle={t("admin.users.table.emptyTitle")}
        emptyDescription={t("admin.users.table.emptyDescription")}
      />

      <AdminUserFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AdminUserFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        user={editing ?? undefined}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("admin.users.delete.title")}
        description={t("admin.users.delete.description", {
          name: deleting?.name ?? "",
        })}
        confirmLabel={t("admin.users.delete.confirm")}
        destructive
        onConfirm={handleDelete}
        isPending={deleteUser.isPending}
      />
    </div>
  )
}
