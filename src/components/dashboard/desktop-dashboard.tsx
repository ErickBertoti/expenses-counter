import Link from "next/link"
import {
  CalendarClockIcon,
  CalendarRangeIcon,
  PencilLineIcon,
  SearchXIcon,
} from "lucide-react"

import {
  MonthlyExpenseDisabledToggleButton,
  PurchaseDisabledToggleButton,
} from "@/components/dashboard/delete-purchase-button"
import { DesktopDashboardHeader } from "@/components/dashboard/desktop-dashboard-header"
import { MonthlyAnalytics } from "@/components/dashboard/monthly-analytics"
import { MonthlyExportPanel } from "@/components/dashboard/monthly-export-panel"
import { PurchaseFilters } from "@/components/dashboard/purchase-filters"
import { ExpenseComposerLink } from "@/components/dashboard/expense-composer-link"
import { PurchaseStatusBadge } from "@/components/dashboard/purchase-status-badge"
import { SortablePurchaseTable } from "@/components/dashboard/sortable-purchase-table"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DashboardData } from "@/lib/dashboard"
import { resolveDashboardMonthHref } from "@/lib/dashboard-url"
import {
  buildReturnToPath,
  formatCurrencyFromCents,
  formatDateLabel,
  formatMonthLabel,
  getInstallmentAmountForMonth,
  getMonthlyExpensePeriodLabel,
} from "@/lib/purchases"
import { cn } from "@/lib/utils"

type DesktopDashboardProps = {
  dashboard: DashboardData
  focusColumnLabel: string
  returnTo: string
}

function SummaryMetric({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
    </div>
  )
}

export function DesktopDashboard({
  dashboard,
  focusColumnLabel,
  returnTo,
}: DesktopDashboardProps) {
  return (
    <div className="hidden lg:block [&_a]:scroll-mt-36 [&_button]:scroll-mt-36 [&_input]:scroll-mt-36">
      <div className="flex w-full flex-col gap-6">
        <DesktopDashboardHeader
          filters={dashboard.filters}
          focusMonth={dashboard.focusMonth}
          email={dashboard.user.email}
        />

        <section className="min-w-0">
          <div className="flex min-w-0 flex-col gap-6">
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Visão do mês
                  </div>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">
                    {dashboard.focusSummary.month_label}
                  </h2>
                </div>
                <p className="max-w-xl text-sm text-muted-foreground">
                  O total do mês é derivado das parcelas que caem nesse
                  período. O saldo restante considera apenas o que ainda não
                  terminou.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryMetric
                  label="Total do mês"
                  value={formatCurrencyFromCents(
                    dashboard.focusSummary.total_amount_cents
                  )}
                  helper={`${dashboard.focusSummary.item_count} itens previstos`}
                />
                <SummaryMetric
                  label="Compras ativas"
                  value={String(dashboard.activePurchaseCount)}
                  helper="Itens que ainda têm parcelas pela frente."
                />
                <SummaryMetric
                  label="Saldo restante"
                  value={formatCurrencyFromCents(dashboard.remainingAmountCents)}
                  helper="Quanto ainda falta completar nas compras filtradas."
                />
                <SummaryMetric
                  label="Mensalidades"
                  value={String(dashboard.activeMonthlyExpenseCount)}
                  helper="Custos recorrentes habilitados nos filtros."
                />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-5">
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
                idPrefix="desktop"
                showCardFilter={dashboard.cards.length > 1}
                showMonthFilter={false}
                compact
              />
            </section>

            {dashboard.filters.view === "purchases" ? (
              <Card className="py-0">
                <CardHeader className="border-b py-5">
                  <div className="flex flex-col gap-1">
                    <CardTitle>Compras cadastradas</CardTitle>
                    <CardDescription>
                      A lista já leva em conta compras antigas, parcelamento
                      restante e filtro por mês.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="py-5">
                  {dashboard.purchases.length === 0 ? (
                    <Empty className="rounded-md border border-dashed border-border bg-muted">
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
                            ? "Compras desativadas ficam ocultas. Ative o switch \"Incluir desativadas nos totais\" nos filtros para encontrá-las sem reativá-las."
                            : "Ajuste os filtros ou use “Nova compra” para cadastrar a primeira compra parcelada."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3 md:hidden">
                        {dashboard.purchases.map((purchase) => {
                          const editHref = buildReturnToPath(dashboard.filters, {
                            edit: purchase.id,
                          })
                          const monthAmount = getInstallmentAmountForMonth(
                            purchase,
                            dashboard.focusMonth
                          )

                          return (
                            <article
                              key={purchase.id}
                              className="rounded-md border border-border bg-muted p-4"
                            >
                              <div className="min-w-0">
                                <h3 className="truncate font-medium">
                                  {purchase.description}
                                </h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <Badge variant="outline">{purchase.card_name}</Badge>
                                  <PurchaseStatusBadge status={purchase.status} />
                                </div>
                              </div>
                              <dl className="mt-4 grid gap-2 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">Compra</dt>
                                  <dd>{formatDateLabel(purchase.purchase_date)}</dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">Período</dt>
                                  <dd className="text-right">
                                    {formatMonthLabel(
                                      purchase.first_installment_month.slice(0, 7)
                                    )}{" "}
                                    até {formatMonthLabel(purchase.completion_month)}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">Progresso</dt>
                                  <dd className="tabular-nums">
                                    {purchase.paid_installments}/
                                    {purchase.installment_count}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">
                                    {focusColumnLabel}
                                  </dt>
                                  <dd className="tabular-nums">
                                    {monthAmount === null
                                      ? "Sem parcela"
                                      : formatCurrencyFromCents(monthAmount)}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">
                                    Saldo restante
                                  </dt>
                                  <dd className="tabular-nums">
                                    {formatCurrencyFromCents(
                                      purchase.remaining_amount_cents
                                    )}
                                  </dd>
                                </div>
                              </dl>
                              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <ExpenseComposerLink
                                  href={editHref}
                                  className={cn(
                                    buttonVariants({
                                      variant: "outline",
                                    }),
                                    "w-full sm:flex-1"
                                  )}
                                >
                                  <PencilLineIcon data-icon="inline-start" />
                                  Editar
                                </ExpenseComposerLink>
                                <PurchaseDisabledToggleButton
                                  description={purchase.description}
                                  disabledState={purchase.status === "disabled"}
                                  purchaseId={purchase.id}
                                  variant="outline"
                                  showLabel
                                  className="w-full sm:flex-1"
                                />
                              </div>
                            </article>
                          )
                        })}
                      </div>

                      <SortablePurchaseTable
                        filters={dashboard.filters}
                        focusColumnLabel={focusColumnLabel}
                        focusMonth={dashboard.focusMonth}
                        purchases={dashboard.purchases}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            ) : dashboard.filters.view === "monthly" ? (
              <Card className="py-0">
                <CardHeader className="border-b py-5">
                  <div className="flex flex-col gap-1">
                    <CardTitle>Mensalidades</CardTitle>
                    <CardDescription>
                      Custos que entram automaticamente em todos os meses do
                      período configurado.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="py-5">
                  {dashboard.monthlyExpenses.length === 0 ? (
                    <Empty className="rounded-md border border-dashed border-border bg-muted">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <CalendarClockIcon />
                        </EmptyMedia>
                        <EmptyTitle>Nenhuma mensalidade encontrada</EmptyTitle>
                        <EmptyDescription>
                          Cadastre academia, assinatura, plano ou outro custo
                          recorrente usando “Mensalidade”.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mensalidade</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.monthlyExpenses.map((monthlyExpense) => {
                          const editHref = buildReturnToPath(
                            dashboard.filters,
                            {
                              editMonthly: monthlyExpense.id,
                            }
                          )

                          return (
                            <TableRow key={monthlyExpense.id}>
                              <TableCell className="min-w-72">
                                <div className="flex flex-col gap-2">
                                  <div className="font-medium">
                                    {monthlyExpense.description}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline">
                                      {monthlyExpense.card_name}
                                    </Badge>
                                    {monthlyExpense.notes ? (
                                      <span>{monthlyExpense.notes}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {formatCurrencyFromCents(monthlyExpense.amount_cents)}
                              </TableCell>
                              <TableCell>
                                {getMonthlyExpensePeriodLabel(monthlyExpense)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    monthlyExpense.is_disabled ? "disabled" : "active"
                                  }
                                >
                                  <span className="size-1.5 rounded-full bg-current opacity-70" />
                                  {monthlyExpense.is_disabled ? "Desativada" : "Ativa"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
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
                                    description={monthlyExpense.description}
                                    disabledState={monthlyExpense.is_disabled}
                                    monthlyExpenseId={monthlyExpense.id}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <MonthlyAnalytics
                  analytics={dashboard.analytics}
                  focusMonth={dashboard.focusMonth}
                  showMonthSelector={false}
                />
              <Card className="py-0">
                <CardHeader className="border-b py-5">
                  <div className="flex flex-col gap-1">
                    <CardTitle>Resumo mensal</CardTitle>
                    <CardDescription>
                      Totais de cada mês considerando as compras visíveis nos
                      filtros atuais.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="py-5">
                  {dashboard.monthlySummaries.length === 0 ? (
                    <Empty className="rounded-md border border-dashed border-border bg-muted">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <CalendarRangeIcon />
                        </EmptyMedia>
                        <EmptyTitle>Sem meses para resumir</EmptyTitle>
                        <EmptyDescription>
                          O resumo mensal aparece automaticamente quando houver ao
                          menos uma compra cadastrada.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      <div className="flex flex-col gap-3 md:hidden">
                        {dashboard.monthlySummaries.map((summary) => {
                          const isFocusMonth = summary.month === dashboard.focusMonth

                          return (
                            <article
                              key={summary.month}
                              className="rounded-md border border-border bg-muted p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="font-medium">
                                    {summary.month_label}
                                  </h3>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {summary.installment_count} parcelas e{" "}
                                    {summary.monthly_expense_count} mensais
                                  </p>
                                </div>
                                {isFocusMonth ? (
                                  <Badge variant="secondary">Em foco</Badge>
                                ) : null}
                              </div>
                              <dl className="mt-4 grid gap-2 text-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">Total</dt>
                                  <dd className="tabular-nums">
                                    {formatCurrencyFromCents(
                                      summary.total_amount_cents
                                    )}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">Compras</dt>
                                  <dd className="tabular-nums">
                                    {summary.purchase_count}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">Mensais</dt>
                                  <dd className="tabular-nums">
                                    {summary.monthly_expense_count}
                                  </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <dt className="text-muted-foreground">Parcelas</dt>
                                  <dd className="tabular-nums">
                                    {summary.installment_count}
                                  </dd>
                                </div>
                              </dl>
                            </article>
                          )
                        })}
                      </div>

                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Mês</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-right">Variação</TableHead>
                              <TableHead className="text-right">Parcelas</TableHead>
                              <TableHead className="text-right">Mensais</TableHead>
                              <TableHead>Maior impacto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dashboard.analytics.monthlyRows.map((summary) => {
                              const isFocusMonth = summary.month === dashboard.focusMonth
                              const monthHref = resolveDashboardMonthHref(
                                returnTo,
                                summary.month
                              )

                              return (
                                <TableRow key={summary.month}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Link
                                        href={monthHref}
                                        scroll={false}
                                        className="font-medium underline-offset-4 hover:underline"
                                      >
                                        {summary.monthLabel}
                                      </Link>
                                      {isFocusMonth ? (
                                        <Badge variant="secondary">Em foco</Badge>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium tabular-nums">
                                    {formatCurrencyFromCents(summary.totalAmountCents)}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    <span className={summary.deltaAmountCents > 0 ? "text-[var(--active)]" : "text-muted-foreground"}>
                                      {summary.deltaAmountCents > 0 ? "+" : summary.deltaAmountCents < 0 ? "−" : ""}
                                      {formatCurrencyFromCents(Math.abs(summary.deltaAmountCents))}
                                    </span>
                                    <div className="mt-0.5 text-xs text-muted-foreground">
                                      {summary.deltaPercentage === null
                                        ? "sem base anterior"
                                        : `${summary.deltaPercentage > 0 ? "+" : ""}${summary.deltaPercentage}%`}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {formatCurrencyFromCents(summary.installmentAmountCents)}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {formatCurrencyFromCents(summary.monthlyAmountCents)}
                                  </TableCell>
                                  <TableCell className="max-w-56">
                                    {summary.topItemDescription ? (
                                      <div className="min-w-0">
                                        <div className="break-words" title={summary.topItemDescription}>
                                          {summary.topItemDescription}
                                        </div>
                                        <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                          {formatCurrencyFromCents(summary.topItemAmountCents)}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Sem itens</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
                <MonthlyExportPanel model={dashboard.monthlyExport} />
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
