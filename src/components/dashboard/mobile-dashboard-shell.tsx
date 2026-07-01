"use client"

import Link from "next/link"
import { useState } from "react"
import {
  CalendarClockIcon,
  CalendarRangeIcon,
  ChevronDownIcon,
  ListFilterIcon,
  PencilLineIcon,
  PlusIcon,
  SearchXIcon,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { signOut } from "@/app/actions"
import {
  MonthlyExpenseDisabledToggleButton,
  PurchaseDisabledToggleButton,
} from "@/components/dashboard/delete-purchase-button"
import { MonthlyAnalytics } from "@/components/dashboard/monthly-analytics"
import { MonthlyExportPanel } from "@/components/dashboard/monthly-export-panel"
import { MonthlyExpenseForm } from "@/components/dashboard/monthly-expense-form"
import { PurchaseFilters } from "@/components/dashboard/purchase-filters"
import { PurchaseForm } from "@/components/dashboard/purchase-form"
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
import type {
  DashboardView,
  MonthlyExpenseFormValues,
  MonthlyExpenseWithCard,
  PurchaseFormValues,
  PurchaseWithProgress,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type MobileDashboardShellProps = {
  dashboard: DashboardData
  focusColumnLabel: string
  formValues: PurchaseFormValues
  monthlyExpenseFormValues: MonthlyExpenseFormValues
  returnTo: string
}

type DashboardBaseFilters = {
  cardId: string
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
        <Link
          href={editHref}
          scroll={false}
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "sm",
            })
          )}
        >
          <PencilLineIcon data-icon="inline-start" />
          Editar
        </Link>
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
  month_label,
  total_amount_cents,
  installment_count,
  monthly_expense_count,
}: DashboardData["monthlySummaries"][number] & {
  isFocusMonth: boolean
}) {
  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">{month_label}</h3>
            {isFocusMonth ? <Badge variant="secondary">Em foco</Badge> : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {installment_count} parcelas e {monthly_expense_count} mensais
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Total
          </div>
          <div className="mt-1 text-sm font-semibold tabular-nums">
            {formatCurrencyFromCents(total_amount_cents)}
          </div>
        </div>
      </div>
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
    {
      ...filtersBase,
      view: "monthly",
    },
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
        <Link
          href={editHref}
          scroll={false}
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "sm",
            })
          )}
        >
          <PencilLineIcon data-icon="inline-start" />
          Editar
        </Link>
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
  formValues,
  monthlyExpenseFormValues,
  returnTo,
}: MobileDashboardShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const composeMode = searchParams.get("compose")
  const editId = searchParams.get("edit")
  const monthlyEditId = searchParams.get("editMonthly")
  const isEditing = Boolean(
    dashboard.selectedPurchase && editId === dashboard.selectedPurchase.id
  )
  const isMonthlyEditing = Boolean(
    dashboard.selectedMonthlyExpense &&
      monthlyEditId === dashboard.selectedMonthlyExpense.id
  )
  const purchaseSheetOpen =
    composeMode === "1" || composeMode === "purchase" || isEditing
  const monthlyExpenseSheetOpen = composeMode === "monthly" || isMonthlyEditing
  const filtersBase: DashboardBaseFilters = {
    query: dashboard.filters.query,
    status: dashboard.filters.status,
    month: dashboard.filters.month,
    cardId: dashboard.filters.cardId,
    view: dashboard.filters.view,
  }
  const newPurchaseHref = buildReturnToPath(filtersBase, {
    compose: "1",
  })
  const newMonthlyExpenseHref = buildReturnToPath(
    {
      ...filtersBase,
      view: "monthly",
    },
    {
      compose: "monthly",
    }
  )
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
    dashboard.filters.month ? formatMonthLabel(dashboard.filters.month) : null,
    dashboard.filters.cardId
      ? dashboard.cards.find((card) => card.id === dashboard.filters.cardId)?.name ?? "Cartão"
      : null,
  ].filter(Boolean) as string[]

  function closePurchaseSheet() {
    router.replace(returnTo, {
      scroll: false,
    })
  }

  return (
    <div className="flex flex-col gap-4 lg:hidden">
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

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={newPurchaseHref}
            scroll={false}
            className={cn(
              buttonVariants({
                size: "lg",
              }),
              "col-span-2 w-full"
            )}
          >
            <PlusIcon data-icon="inline-start" />
            Nova compra
          </Link>
          <Link
            href={newMonthlyExpenseHref}
            scroll={false}
            className={cn(
              buttonVariants({
                size: "lg",
                variant: "outline",
              }),
              "w-full"
            )}
          >
            <CalendarClockIcon data-icon="inline-start" />
            Mensalidade
          </Link>
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
            breakdown={dashboard.focusBreakdown}
            summaries={dashboard.monthlySummaries}
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
            dashboard.monthlySummaries.map((summary) => (
              <MobileSummaryCard
                key={summary.month}
                {...summary}
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
          {dashboard.purchases.length === 0 ? (
            <Empty className="rounded-md border border-dashed border-border bg-muted p-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon />
                </EmptyMedia>
                <EmptyTitle>Nenhuma compra encontrada</EmptyTitle>
                <EmptyDescription>
                  Ajuste os filtros ou cadastre a primeira compra parcelada.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            dashboard.purchases.map((purchase) => (
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

      <Drawer
        open={purchaseSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            closePurchaseSheet()
          }
        }}
      >
        <DrawerContent className="max-w-none sm:max-w-xl">
          <div className="absolute right-4 top-4 z-10">
            <DrawerClose />
          </div>
          <PurchaseForm
            cards={dashboard.cards}
            idPrefix="mobile-purchase"
            initialValues={formValues}
            isEditing={isEditing}
            returnTo={returnTo}
            variant="mobile"
          />
        </DrawerContent>
      </Drawer>

      <Drawer
        open={monthlyExpenseSheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            closePurchaseSheet()
          }
        }}
      >
        <DrawerContent className="max-w-none sm:max-w-xl">
          <div className="absolute right-4 top-4 z-10">
            <DrawerClose />
          </div>
          <MonthlyExpenseForm
            cards={dashboard.cards}
            idPrefix="mobile-monthly"
            initialValues={monthlyExpenseFormValues}
            isEditing={isMonthlyEditing}
            returnTo={returnTo}
            variant="mobile"
          />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
