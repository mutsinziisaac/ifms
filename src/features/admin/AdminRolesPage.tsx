import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Lock, Pencil, Plus, Shield, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDeleteRole, useRoles, useWebUsers } from "@/data/hooks"
import type { Role } from "@/data/types"

import { RoleFormDialog } from "./components/RoleFormDialog"

export function AdminRolesPage() {
  const { t } = useTranslation()
  const rolesQuery = useRoles()
  const webUsers = useWebUsers().data ?? []
  const deleteRole = useDeleteRole()

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data])

  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)

  const userCountByRole = useMemo(() => {
    const map = new Map<string, number>()
    for (const u of webUsers) map.set(u.roleId, (map.get(u.roleId) ?? 0) + 1)
    return map
  }, [webUsers])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return roles
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        r.description.toLowerCase().includes(needle)
    )
  }, [roles, search])

  const columns: DataTableColumn<Role>[] = [
    {
      key: "name",
      header: t("admin.roles.table.name"),
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Shield className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{r.name}</p>
              {r.systemFixed && (
                <Badge variant="outline" className="gap-1 font-normal">
                  <Lock className="size-3" />
                  {t("admin.roles.systemFixedBadge")}
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {r.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: t("admin.roles.table.type"),
      render: (r) => (
        <Badge variant="outline" className="font-normal">
          {t(`enums.roleType.${r.type}`)}
        </Badge>
      ),
    },
    {
      key: "permissions",
      header: t("admin.roles.table.permissions"),
      render: (r) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {t("admin.roles.permissionsCount", { count: r.permissions.length })}
        </span>
      ),
    },
    {
      key: "users",
      header: t("admin.roles.table.users"),
      render: (r) => (
        <span className="text-sm tabular-nums">
          {t("admin.roles.usersCount", {
            count: userCountByRole.get(r.id) ?? 0,
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={r.systemFixed}
            onClick={(e) => {
              e.stopPropagation()
              setEditing(r)
            }}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("admin.roles.actions.edit")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={r.systemFixed}
            onClick={(e) => {
              e.stopPropagation()
              setDeleting(r)
            }}
          >
            <Trash2 className="size-4 text-rose-500" />
            <span className="sr-only">{t("admin.roles.actions.delete")}</span>
          </Button>
        </div>
      ),
    },
  ]

  function handleDelete() {
    if (!deleting) return
    deleteRole.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(t("admin.roles.toast.deleted"))
        setDeleting(null)
      },
      onError: (err: unknown) => {
        toast.error(
          err instanceof Error ? err.message : t("admin.roles.toast.error")
        )
        setDeleting(null)
      },
    })
  }

  return (
    <div>
      <PageHeader
        title={t("admin.roles.title")}
        description={t("admin.roles.description")}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t("admin.roles.addButton")}
          </Button>
        }
      />

      <DataTable
        data={filtered}
        columns={columns}
        isLoading={rolesQuery.isLoading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("admin.roles.table.searchPlaceholder")}
        onRowClick={(r) => !r.systemFixed && setEditing(r)}
        emptyTitle={t("admin.roles.table.emptyTitle")}
        emptyDescription={t("admin.roles.table.emptyDescription")}
      />

      <RoleFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <RoleFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        role={editing ?? undefined}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("admin.roles.delete.title")}
        description={t("admin.roles.delete.description", {
          name: deleting?.name ?? "",
        })}
        confirmLabel={t("admin.roles.delete.confirm")}
        destructive
        onConfirm={handleDelete}
        isPending={deleteRole.isPending}
      />
    </div>
  )
}
