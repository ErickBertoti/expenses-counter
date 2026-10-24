"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  CalendarClockIcon,
  CalendarRangeIcon,
  ChevronDownIcon,
  ListFilterIcon,
  PencilLineIcon,
  PlusIcon,
  SearchXIcon,
} from "lucide-react"

import { signOut } from "@/app/actions"
import {
  MonthlyExpenseDisabledToggleButton,
  PurchaseDisabledToggleButton,
} from "@/components/dashboard/delete-purchase-button"
import { MonthlyAnalytics } from "@/components/dashboard/monthly-analytics"
import { MonthlyExportPanel } from "@/components/dashboard/monthly-export-panel"
import { PurchaseFilters } from "@/components/dashboard/purchase-filters"
import { ExpenseComposerLink } from "@/components/dashboard/expense-composer-link"
import { PurchaseStatusBadge } from "@/components/dashboard/purchase-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerHeading,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { DashboardData } from "@/lib/dashboard"
import {
  buildReturnToPath,
  formatCurrencyFromCents,
  formatDateLabel,
  formatMonthLabel,
  getInstallmentAmountForMonth,
  getMonthlyExpensePeriodLabel,
} from "@/lib/purchases"
import { resolveDashboardMonthHref } from "@/lib/dashboard-url"
import type {
  DashboardView,
  MonthlyExpenseWithCard,
  PurchaseWithProgress,
} from "@/lib/types"
import { sortPurchases, type PurchaseSortKey } from "@/lib/purchase-sorting"
import { cn } from "@/lib/utils"

type MobileDashboardShellProps = {
  dashboard: DashboardData
  focusColumnLabel: string
  returnTo: string
}

type DashboardBaseFilters = {
  cardId: string
  includeDisabled: boolean
  month: string
  query: string
  status: "all" | PurchaseWithProgress["status"]
  view: DashboardView
}

function MobileMetric({
  helper,
  label,
  value,
}: {
  helper: string
  label: string
  value: string
}) {
  return (
    <article className="min-w-[15rem] snap-start rounded-md border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
    </article>
  )
}

function MobilePurchaseCard({
  filtersBase,
  focusColumnLabel,
  focusMonth,
  purchase,
}: {
  filtersBase: DashboardBaseFilters
  focusColumnLabel: string
  focusMonth: string
  purchase: PurchaseWithProgress
}) {
  const editHref = buildReturnToPath(filtersBase, {
    edit: purchase.id,
  })
  const monthAmount = getInstallmentAmountForMonth(purchase, focusMonth)

  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
              {purchase.description}
            </h3>
            <PurchaseStatusBadge status={purchase.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{purchase.card_name}</Badge>
            <Badge variant="secondary">
              {monthAmount === null
                ? "Sem parcela no foco"
                : formatCurrencyFromCents(monthAmount)}
            </Badge>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Saldo
          </div>
          <div className="mt-1 text-sm font-semibold tabular-nums">
            {formatCurrencyFromCents(purchase.remaining_amount_cents)}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-muted p-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Progresso
          </div>
          <div className="mt-1 font-medium tabular-nums">
            {purchase.paid_installments}/{purchase.installment_count}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Parcela em foco
          </div>
          <div
            className="mt-1 truncate font-medium tabular-nums"
            title={focusColumnLabel}
          >
            {monthAmount === null
              ? "Sem parcela"
              : formatCurrencyFromCents(monthAmount)}
          </div>
        </div>
      </div>

      <details className="group mt-3 rounded-md border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm text-muted-foreground">
          <span>Ver detalhes</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <dl className="grid gap-2 border-t border-border px-3 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Compra</dt>
            <dd className="tabular-nums">
              {formatDateLabel(purchase.purchase_date)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Período</dt>
            <dd className="text-right">
              {formatMonthLabel(purchase.first_installment_month.slice(0, 7))} até{" "}
              {formatMonthLabel(purchase.completion_month)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="tabular-nums">
              {formatCurrencyFromCents(purchase.total_amount_cents)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Saldo restante</dt>
            <dd className="tabular-nums">
              {formatCurrencyFromCents(purchase.remaining_amount_cents)}
            </dd>
          </div>
        </dl>
      </details>

      <div className="mt-3 flex items-center justify-end gap-2">
        <ExpenseComposerLink
          href={editHref}
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "sm",
            })
          )}
        >
          <PencilLineIcon data-icon="inline-start" />
          Editar
        </ExpenseComposerLink>
        <PurchaseDisabledToggleButton
          className="shrink-0"
          description={purchase.description}
          disabledState={purchase.status === "disabled"}
          purchaseId={purchase.id}
          showLabel
          size="sm"
          variant="outline"
        />
      </div>
    </article>
  )
}

function MobileSummaryCard({
  isFocusMonth,
  returnTo,
  summary,
}: {
  isFocusMonth: boolean
  returnTo: string
  summary: DashboardData["analytics"]["monthlyRows"][number]
}) {
  const monthHref = resolveDashboardMonthHref(returnTo, summary.month)

  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={monthHref}
              scroll={false}
              className="truncate text-sm font-medium underline-offset-4 active:scale-[0.98]"
            >
              {summary.monthLabel}
            </Link>
            {isFocusMonth ? <Badge variant="secondary">Em foco</Badge> : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {summary.itemCount} itens · maior impacto{" "}
            {summary.topItemDescription ? (
              <>
                <span className="break-words text-foreground">{summary.topItemDescription}</span>{" "}
                · {formatCurrencyFromCents(summary.topItemAmountCents)}
              </>
            ) : (
              "não disponível"
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Total
          </div>
          <div className="mt-1 text-sm font-semibold tabular-nums">
            {formatCurrencyFromCents(summary.totalAmountCents)}
          </div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Variação</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {summary.deltaAmountCents > 0 ? "+" : summary.deltaAmountCents < 0 ? "−" : ""}
            {formatCurrencyFromCents(Math.abs(summary.deltaAmountCents))}
            <span className="block text-[11px] text-muted-foreground">
              {summary.deltaPercentage === null
                ? "sem base anterior"
                : `${summary.deltaPercentage > 0 ? "+" : ""}${summary.deltaPercentage}%`}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Parcelas</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {formatCurrencyFromCents(summary.installmentAmountCents)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Mensais</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {formatCurrencyFromCents(summary.monthlyAmountCents)}
          </dd>
        </div>
      </dl>
    </article>
  )
}

function MobileMonthlyExpenseCard({
  filtersBase,
  monthlyExpense,
}: {
  filtersBase: DashboardBaseFilters
  monthlyExpense: MonthlyExpenseWithCard
}) {
  const editHref = buildReturnToPath(
    filtersBase,
    {
      editMonthly: monthlyExpense.id,
    }
  )

  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
              {monthlyExpense.description}
            </h3>
            <Badge variant={monthlyExpense.is_disabled ? "disabled" : "active"}>
              <span className="size-1.5 rounded-full bg-current opacity-70" />
              {monthlyExpense.is_disabled ? "Desativada" : "Ativa"}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{monthlyExpense.card_name}</Badge>
            <Badge variant="secondary">
              {formatCurrencyFromCents(monthlyExpense.amount_cents)}
            </Badge>
          </div>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 rounded-md bg-muted p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Período</dt>
          <dd className="text-right">{getMonthlyExpensePeriodLabel(monthlyExpense)}</dd>
        </div>
        {monthlyExpense.notes ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Obs.</dt>
            <dd className="text-right">{monthlyExpense.notes}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-3 flex items-center justify-end gap-2">
        <ExpenseComposerLink
          href={editHref}
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "sm",
            })
          )}
        >
          <PencilLineIcon data-icon="inline-start" />
          Editar
        </ExpenseComposerLink>
        <MonthlyExpenseDisabledToggleButton
          className="shrink-0"
          description={monthlyExpense.description}
          disabledState={monthlyExpense.is_disabled}
          monthlyExpenseId={monthlyExpense.id}
          showLabel
          size="sm"
          variant="outline"
        />
      </div>
    </article>
  )
}

export function MobileDashboardShell({
  dashboard,
  focusColumnLabel,
  returnTo,
}: MobileDashboardShellProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const purchaseSignature = dashboard.purchases
    .map((purchase) => `${purchase.id}:${purchase.updated_at}`)
    .join(":")
  const purchaseSortContext = `${dashboard.focusMonth}:${purchaseSignature}`
  const [purchaseSortState, setPurchaseSortState] = useState({
    context: "",
    value: "default",
  })
  const purchaseSort =
    purchaseSortState.context === purchaseSortContext
      ? purchaseSortState.value
      : "default"
  const filtersBase: DashboardBaseFilters = {
    query: dashboard.filters.query,
    status: dashboard.filters.status,
    includeDisabled: dashboard.filters.includeDisabled,
    month: dashboard.filters.month,
    cardId: dashboard.filters.cardId,
    view: dashboard.filters.view,
  }
  const sortedPurchases = useMemo(() => {
    if (purchaseSort === "default") return dashboard.purchases
    const [key, direction] = purchaseSort.split(":") as [
      PurchaseSortKey,
      "ascending" | "descending",
    ]
    return sortPurchases(dashboard.purchases, dashboard.focusMonth, key, direction)
  }, [dashboard.focusMonth, dashboard.purchases, purchaseSort])

  const newPurchaseHref = buildReturnToPath(filtersBase, {
    compose: "1",
  })
  const newMonthlyExpenseHref = buildReturnToPath(filtersBase, { compose: "monthly" })
  const purchasesViewHref = buildReturnToPath({
    ...filtersBase,
    view: "purchases",
  })
  const summaryViewHref = buildReturnToPath({
    ...filtersBase,
    view: "summary",
  })
  const monthlyViewHref = buildReturnToPath({
    ...filtersBase,
    view: "monthly",
  })
  const clearFiltersHref = buildReturnToPath({
    query: "",
    status: "all",
    month: "",
    cardId: "",
    view: dashboard.filters.view,
  })
  const activeFilters = [
    dashboard.filters.query
      ? `Busca: ${dashboard.filters.query.slice(0, 24)}`
      : null,
    dashboard.filters.status === "active"
      ? "Somente em andamento"
      : dashboard.filters.status === "completed"
        ? "Somente concluídas"
        : dashboard.filters.status === "disabled"
          ? "Somente desativadas"
          : null,
    dashboard.filters.includeDisabled ? "Incluindo desativadas" : null,
    dashboard.filters.month ? formatMonthLabel(dashboard.filters.month) : null,
    dashboard.filters.cardId
      ? dashboard.cards.find((card) => card.id === dashboard.filters.cardId)?.name ?? "Cartão"
      : null,
  ].filter(Boolean) as string[]

  return (
    <div className="flex flex-col gap-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden">
      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="w-fit">
              Dashboard pessoal
            </Badge>
            <h1 className="mt-3 font-heading text-[1.7rem] leading-tight font-semibold tracking-tight text-balance">
              Despesas parceladas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {dashboard.focusSummary.month_label}
            </p>
          </div>
          <form action={signOut}>
            <Button type="submit" size="sm" variant="outline">
              Sair
            </Button>
          </form>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="min-w-0 max-w-full truncate px-3 py-1 text-xs"
          >
            {dashboard.user.email}
          </Badge>
        </div>

        <div className="mt-4">
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => setFiltersOpen(true)}
          >
            <ListFilterIcon data-icon="inline-start" />
            Filtros
          </Button>
        </div>
      </section>

      <section className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <MobileMetric
          label="Total do mês"
          value={formatCurrencyFromCents(dashboard.focusSummary.total_amount_cents)}
          helper={`${dashboard.focusSummary.item_count} itens previstos`}
        />
        <MobileMetric
          label="Compras ativas"
          value={String(dashboard.activePurchaseCount)}
          helper="Itens que ainda têm parcelas pela frente."
        />
        <MobileMetric
          label="Saldo restante"
          value={formatCurrencyFromCents(dashboard.remainingAmountCents)}
          helper="Quanto ainda falta completar nas compras filtradas."
        />
        <MobileMetric
          label="Mensalidades"
          value={String(dashboard.activeMonthlyExpenseCount)}
          helper="Custos recorrentes habilitados nos filtros."
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-1">
          <Link
            href={purchasesViewHref}
            scroll={false}
            className={cn(
              buttonVariants({
                variant:
                  dashboard.filters.view === "purchases" ? "secondary" : "ghost",
                size: "sm",
              }),
              "min-w-0 flex-1 justify-center"
            )}
          >
            Compras
          </Link>
          <Link
            href={summaryViewHref}
            scroll={false}
            className={cn(
              buttonVariants({
                variant:
                  dashboard.filters.view === "summary" ? "secondary" : "ghost",
                size: "sm",
              }),
              "min-w-0 flex-1 justify-center"
            )}
          >
            Resumo
          </Link>
          <Link
            href={monthlyViewHref}
            scroll={false}
            className={cn(
              buttonVariants({
                variant:
                  dashboard.filters.view === "monthly" ? "secondary" : "ghost",
                size: "sm",
              }),
              "min-w-0 flex-1 justify-center"
            )}
          >
            Mensais
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeFilters.length > 0 ? (
            <>
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="outline" className="max-w-full truncate">
                  {filter}
                </Badge>
              ))}
              <Link
                href={clearFiltersHref}
                scroll={false}
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                    size: "xs",
                  })
                )}
              >
                Limpar
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem filtros ativos. Use o sheet para buscar, trocar o mês ou focar um cartão.
            </p>
          )}
        </div>
      </section>

      {dashboard.filters.view === "summary" ? (
        <section className="flex flex-col gap-3">
          <MonthlyAnalytics
            analytics={dashboard.analytics}
            focusMonth={dashboard.focusMonth}
          />
          <MonthlyExportPanel model={dashboard.monthlyExport} />
          {dashboard.monthlySummaries.length === 0 ? (
            <Empty className="rounded-md border border-dashed border-border bg-muted p-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarRangeIcon />
                </EmptyMedia>
                <EmptyTitle>Sem meses para resumir</EmptyTitle>
                <EmptyDescription>
                  O resumo mensal aparece automaticamente quando houver ao menos
                  uma compra cadastrada.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            dashboard.analytics.monthlyRows.map((summary) => (
              <MobileSummaryCard
                key={summary.month}
                returnTo={returnTo}
                summary={summary}
                isFocusMonth={summary.month === dashboard.focusMonth}
              />
            ))
          )}
        </section>
      ) : dashboard.filters.view === "monthly" ? (
        <section className="flex flex-col gap-3">
          {dashboard.monthlyExpenses.length === 0 ? (
            <Empty className="rounded-md border border-dashed border-border bg-muted p-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarClockIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhuma mensalidade encontrada</EmptyTitle>
                <EmptyDescription>
                  Cadastre academia, assinatura, plano ou outro custo recorrente.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            dashboard.monthlyExpenses.map((monthlyExpense) => (
              <MobileMonthlyExpenseCard
                key={monthlyExpense.id}
                filtersBase={filtersBase}
                monthlyExpense={monthlyExpense}
              />
            ))
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          {dashboard.purchases.length > 0 ? (
            <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <span className="text-muted-foreground">Ordenar compras</span>
              <select
                value={purchaseSort}
                onChange={(event) =>
                  setPurchaseSortState({
                    context: purchaseSortContext,
                    value: event.target.value,
                  })
                }
                className="min-w-0 max-w-48 rounded-sm border border-input bg-background px-2 py-1.5 text-right text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="default">Ordem padrão</option>
                <option value="installment:descending">Maior parcela</option>
                <option value="total:descending">Maior total</option>
                <option value="remaining:descending">Maior saldo</option>
                <option value="duration:descending">Mais longa</option>
                <option value="completion:ascending">Termina primeiro</option>
                <option value="purchase:ascending">Nome A–Z</option>
              </select>
            </label>
          ) : null}
          {dashboard.purchases.length === 0 ? (
            <Empty className="rounded-md border border-dashed border-border bg-muted p-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhuma compra encontrada</EmptyTitle>
                <EmptyDescription>
                  {dashboard.filters.status === "all" &&
                  !dashboard.filters.includeDisabled &&
                  !dashboard.filters.query &&
                  !dashboard.filters.month &&
                  !dashboard.filters.cardId
                    ? "Compras desativadas ficam ocultas. Abra Filtros e ative o switch para encontrá-las sem reativá-las."
                    : "Ajuste os filtros ou cadastre a primeira compra parcelada."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            sortedPurchases.map((purchase) => (
              <MobilePurchaseCard
                key={purchase.id}
                filtersBase={filtersBase}
                focusColumnLabel={focusColumnLabel}
                focusMonth={dashboard.focusMonth}
                purchase={purchase}
              />
            ))
          )}
        </section>
      )}

      <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerHeading>
              <DrawerTitle>Filtros</DrawerTitle>
              <p className="text-sm text-muted-foreground">
                Ajuste busca, status, mês e cartão sem sair da dashboard.
              </p>
            </DrawerHeading>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>
            <PurchaseFilters
              key={JSON.stringify({
                cardId: dashboard.filters.cardId,
                includeDisabled: dashboard.filters.includeDisabled,
                month: dashboard.filters.month,
                query: dashboard.filters.query,
                status: dashboard.filters.status,
                view: dashboard.filters.view,
              })}
              cards={dashboard.cards}
              filters={dashboard.filters}
              idPrefix="mobile-filters"
              showCardFilter={dashboard.cards.length > 1}
              variant="mobile"
            />
          </DrawerBody>
          <DrawerFooter>
            <Button type="button" className="w-full" onClick={() => setFiltersOpen(false)}>
              Fechar filtros
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <nav aria-label="Cadastrar despesas" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-3xl gap-2">
          <ExpenseComposerLink href={newPurchaseHref} data-expense-trigger="purchase" className={cn(buttonVariants({ size: "lg" }), "min-w-0 flex-1")}>
            <PlusIcon data-icon="inline-start" />
            Nova compra
          </ExpenseComposerLink>
          <ExpenseComposerLink href={newMonthlyExpenseHref} data-expense-trigger="monthly" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "min-w-0 flex-1")}>
            <CalendarClockIcon data-icon="inline-start" />
            Mensalidade
          </ExpenseComposerLink>
        </div>
      </nav>
    </div>
  )
}
