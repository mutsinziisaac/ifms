import { useState } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/common/EmptyState"

export interface DataTableColumn<T> {
  key: string
  header: React.ReactNode
  className?: string
  render: (row: T) => React.ReactNode
}

export interface DataTableFilterOption {
  value: string
  label: string
}

export interface DataTableFilter {
  key: string
  label: string
  value: string
  options: DataTableFilterOption[]
  onChange: (value: string) => void
}

export interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: DataTableColumn<T>[]
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  toolbarActions?: React.ReactNode
  onRowClick?: (row: T) => void
  pageSize?: number
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  toolbarActions,
  onRowClick,
  pageSize = 10,
  isLoading,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>): React.ReactElement {
  const { t } = useTranslation()
  const [pageState, setPage] = useState(0)

  const total = data.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  // Clamp during render so the page stays valid when the data set shrinks
  // (e.g. after filtering) — no effect, no cascading render.
  const page = Math.min(pageState, pageCount - 1)

  const start = page * pageSize
  const pageRows = data.slice(start, start + pageSize)
  const colSpan = columns.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <div className="relative w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                searchPlaceholder ?? t("common.table.searchPlaceholder")
              }
              className="pl-9"
            />
          </div>
        )}
        {filters?.map((filter) => {
          const selected = filter.options.find(
            (opt) => opt.value === filter.value
          )
          const display =
            filter.value === "all" || !selected
              ? `${filter.label}: ${t("common.all")}`
              : `${filter.label}: ${selected.label}`
          return (
            <Select
              key={filter.key}
              value={filter.value}
              onValueChange={filter.onChange}
            >
              <SelectTrigger className="h-9 min-w-36">
                <SelectValue>{display}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        })}
        <div className="flex-1" />
        {toolbarActions}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "text-xs tracking-wider text-muted-foreground uppercase",
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rowIdx) => (
                <TableRow key={`skeleton-${rowIdx}`}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan}>
                  <EmptyState
                    title={emptyTitle ?? t("common.table.noResults")}
                    description={emptyDescription}
                  />
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    onRowClick &&
                      "cursor-pointer transition-colors hover:bg-accent/50"
                  )}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("common.table.showingRange", {
              from: start + 1,
              to: Math.min(start + pageSize, total),
              total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft />
              <span className="sr-only">{t("common.table.previousPage")}</span>
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
            >
              <ChevronRight />
              <span className="sr-only">{t("common.table.nextPage")}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
