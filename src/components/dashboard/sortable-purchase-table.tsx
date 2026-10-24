"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  PencilLineIcon,
} from "lucide-react"

import { PurchaseDisabledToggleButton } from "@/components/dashboard/delete-purchase-button"
import { PurchaseStatusBadge } from "@/components/dashboard/purchase-status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DashboardData } from "@/lib/dashboard"
import {
  buildReturnToPath,
  formatCurrencyFromCents,
  formatDateLabel,
  formatMonthLabel,
  getInstallmentAmountForMonth,
} from "@/lib/purchases"
import {
  sortPurchases,
  type PurchaseSortKey,
  type SortDirection,
} from "@/lib/purchase-sorting"
import { cn } from "@/lib/utils"

type SortablePurchaseTableProps = {
  filters: DashboardData["filters"]
  focusColumnLabel: string
  focusMonth: string
  purchases: DashboardData["purchases"]
}

const numericKeys = new Set<PurchaseSortKey>([
  "installment",
  "total",
  "remaining",
  "duration",
])

function nextSort(
  currentKey: PurchaseSortKey | null,
  currentDirection: SortDirection,
  key: PurchaseSortKey
) {
  if (currentKey !== key) {
    return {
      key,
      direction: (numericKeys.has(key) ? "descending" : "ascending") as SortDirection,
    }
  }
  if (currentDirection === "ascending") {
    return { key, direction: "descending" as SortDirection }
  }
  return { key: null, direction: "ascending" as SortDirection }
}

export function SortablePurchaseTable({
  filters,
  focusColumnLabel,
  focusMonth,
  purchases,
}: SortablePurchaseTableProps) {
  const signature = purchases
    .map((purchase) => `${purchase.id}:${purchase.updated_at}`)
    .join(":")
  const sortContext = `${focusMonth}:${signature}`
  const [sortState, setSortState] = useState<{
    context: string
    key: PurchaseSortKey | null
    direction: SortDirection
  }>({
    context: "",
    key: null,
    direction: "ascending",
  })
  const sortKey = sortState.context === sortContext ? sortState.key : null
  const direction =
    sortState.context === sortContext ? sortState.direction : "ascending"

  const sortedPurchases = useMemo(
    () => sortPurchases(purchases, focusMonth, sortKey, direction),
    [direction, focusMonth, purchases, sortKey]
  )
  const announcement = sortKey
    ? `Compras ordenadas por ${sortKey}, em ordem ${direction === "ascending" ? "crescente" : "decrescente"}.`
    : "Compras na ordem padrão."

  function toggleSort(key: PurchaseSortKey) {
    const next = nextSort(sortKey, direction, key)
    setSortState({
      context: sortContext,
      key: next.key,
      direction: next.direction,
    })
  }

  function ariaSort(key: PurchaseSortKey) {
    return sortKey === key ? direction : "none"
  }

  return (
    <div className="hidden overflow-x-auto md:block">
      <p className="sr-only" aria-live="polite">{announcement}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="Compra" sortKey="purchase" activeKey={sortKey} direction={direction} onSort={toggleSort} ariaSort={ariaSort("purchase")} />
            <SortableHead label={focusColumnLabel} sortKey="installment" activeKey={sortKey} direction={direction} onSort={toggleSort} ariaSort={ariaSort("installment")} alignRight />
            <SortableHead label="Total" sortKey="total" activeKey={sortKey} direction={direction} onSort={toggleSort} ariaSort={ariaSort("total")} alignRight />
            <SortableHead label="Restante" sortKey="remaining" activeKey={sortKey} direction={direction} onSort={toggleSort} ariaSort={ariaSort("remaining")} alignRight />
            <SortableHead label="Prazo" sortKey="duration" activeKey={sortKey} direction={direction} onSort={toggleSort} ariaSort={ariaSort("duration")} alignRight />
            <SortableHead label="Termina" sortKey="completion" activeKey={sortKey} direction={direction} onSort={toggleSort} ariaSort={ariaSort("completion")} />
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPurchases.map((purchase) => {
            const editHref = buildReturnToPath(filters, { edit: purchase.id })
            const monthAmount = getInstallmentAmountForMonth(purchase, focusMonth)

            return (
              <TableRow key={purchase.id}>
                <TableCell className="min-w-56">
                  <div className="font-medium">{purchase.description}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{purchase.card_name}</Badge>
                    <span>{formatDateLabel(purchase.purchase_date)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {monthAmount === null ? (
                    <span className="text-muted-foreground">Sem parcela</span>
                  ) : formatCurrencyFromCents(monthAmount)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrencyFromCents(purchase.total_amount_cents)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrencyFromCents(purchase.remaining_amount_cents)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-medium tabular-nums">
                    {purchase.paid_installments}/{purchase.installment_count}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {purchase.remaining_installments} restantes
                  </div>
                </TableCell>
                <TableCell>
                  <span className="whitespace-nowrap">
                    {formatMonthLabel(purchase.completion_month)}
                  </span>
                </TableCell>
                <TableCell><PurchaseStatusBadge status={purchase.status} /></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Link
                      href={editHref}
                      scroll={false}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      <PencilLineIcon data-icon="inline-start" />
                      Editar
                    </Link>
                    <PurchaseDisabledToggleButton
                      description={purchase.description}
                      disabledState={purchase.status === "disabled"}
                      purchaseId={purchase.id}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SortableHead({
  activeKey,
  alignRight = false,
  ariaSort,
  direction,
  label,
  onSort,
  sortKey,
}: {
  activeKey: PurchaseSortKey | null
  alignRight?: boolean
  ariaSort: "none" | SortDirection
  direction: SortDirection
  label: string
  onSort: (key: PurchaseSortKey) => void
  sortKey: PurchaseSortKey
}) {
  const active = activeKey === sortKey
  const Icon = active
    ? direction === "ascending"
      ? ArrowUpIcon
      : ArrowDownIcon
    : ChevronsUpDownIcon

  return (
    <TableHead aria-sort={ariaSort} className={cn(alignRight && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm transition-[color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none",
          alignRight && "w-full justify-end",
          active ? "text-foreground" : "hover:text-foreground"
        )}
      >
        {label}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    </TableHead>
  )
}
