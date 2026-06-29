import Link from "next/link"
import {
  CalendarClockIcon,
  CalendarRangeIcon,
  PencilLineIcon,
  SearchXIcon,
} from "lucide-react"

import { signOut } from "@/app/actions"
import {
  MonthlyExpenseDisabledToggleButton,
  PurchaseDisabledToggleButton,
} from "@/components/dashboard/delete-purchase-button"
import { MonthlyAnalytics } from "@/components/dashboard/monthly-analytics"
import { MonthlyExpenseForm } from "@/components/dashboard/monthly-expense-form"
import { PurchaseFilters } from "@/components/dashboard/purchase-filters"
import { PurchaseForm } from "@/components/dashboard/purchase-form"
import { PurchaseStatusBadge } from "@/components/dashboard/purchase-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import {
  buildReturnToPath,
  formatCurrencyFromCents,
  formatDateLabel,
  formatMonthLabel,
  getInstallmentAmountForMonth,
  getMonthlyExpensePeriodLabel,
} from "@/lib/purchases"
import type { MonthlyExpenseFormValues, PurchaseFormValues } from "@/lib/types"
import { cn } from "@/lib/utils"

type DesktopDashboardProps = {
  dashboard: DashboardData
  focusColumnLabel: string
  formValues: PurchaseFormValues
  monthlyExpenseFormValues: MonthlyExpenseFormValues
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
  formValues,
  monthlyExpenseFormValues,
  returnTo,
}: DesktopDashboardProps) {
  return (
    <div className="hidden lg:block">
      <div className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <Badge variant="outline" className="w-fit">
              Dashboard pessoal
            </Badge>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Contador de despesas do cartão.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Cadastre compras parceladas, descubra automaticamente o que já
                terminou e acompanhe o total de cada mês sem planilha.
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <Badge
              variant="secondary"
              className="w-full justify-center truncate text-center sm:w-auto sm:max-w-full sm:justify-start sm:text-left"
            >
              {dashboard.user.email}
            </Badge>
            <form action={signOut} className="w-full sm:w-auto">
              <Button variant="outline" type="submit" className="w-full">
                Sair
              </Button>
            </form>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_23rem]">
          <div className="order-2 flex min-w-0 flex-col gap-6 xl:order-1">
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
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

            <MonthlyAnalytics
              breakdown={dashboard.focusBreakdown}
              summaries={dashboard.monthlySummaries}
            />

            <section className="rounded-lg border border-border bg-card p-5">
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
                idPrefix="desktop"
                showCardFilter={dashboard.cards.length > 1}
              />
            </section>

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
                        Ajuste os filtros ou cadastre a primeira compra
                        parcelada no painel ao lado.
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
                              <Link
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
                              </Link>
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

                    <div className="hidden overflow-x-auto md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Compra</TableHead>
                            <TableHead>{focusColumnLabel}</TableHead>
                            <TableHead>Progresso</TableHead>
                            <TableHead>Saldo restante</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboard.purchases.map((purchase) => {
                            const editHref = buildReturnToPath(dashboard.filters, {
                              edit: purchase.id,
                            })
                            const monthAmount = getInstallmentAmountForMonth(
                              purchase,
                              dashboard.focusMonth
                            )

                            return (
                              <TableRow key={purchase.id}>
                                <TableCell className="min-w-72">
                                  <div className="flex flex-col gap-2">
                                    <div className="font-medium">
                                      {purchase.description}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                      <Badge variant="outline">
                                        {purchase.card_name}
                                      </Badge>
                                      <span>
                                        Compra em{" "}
                                        {formatDateLabel(purchase.purchase_date)}
                                      </span>
                                      <span>
                                        {formatMonthLabel(
                                          purchase.first_installment_month.slice(0, 7)
                                        )}{" "}
                                        até {formatMonthLabel(purchase.completion_month)}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {monthAmount === null
                                    ? "Sem parcela"
                                    : formatCurrencyFromCents(monthAmount)}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium tabular-nums">
                                    {purchase.paid_installments}/
                                    {purchase.installment_count}
                                  </div>
                                  <div className="text-xs text-muted-foreground tabular-nums">
                                    {formatCurrencyFromCents(
                                      purchase.total_amount_cents
                                    )}{" "}
                                    no total
                                  </div>
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {formatCurrencyFromCents(
                                    purchase.remaining_amount_cents
                                  )}
                                </TableCell>
                                <TableCell>
                                  <PurchaseStatusBadge status={purchase.status} />
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-end gap-2">
                                    <Link
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
                  </>
                )}
              </CardContent>
            </Card>

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
                        recorrente no painel lateral.
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
                          {
                            ...dashboard.filters,
                            view: "monthly",
                          },
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
                                <Link
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
                                </Link>
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
                            <TableHead>Total</TableHead>
                            <TableHead>Parcelas</TableHead>
                            <TableHead>Mensais</TableHead>
                            <TableHead>Itens</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashboard.monthlySummaries.map((summary) => {
                            const isFocusMonth = summary.month === dashboard.focusMonth

                            return (
                              <TableRow key={summary.month}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span>{summary.month_label}</span>
                                    {isFocusMonth ? (
                                      <Badge variant="secondary">Em foco</Badge>
                                    ) : null}
                                  </div>
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {formatCurrencyFromCents(
                                    summary.total_amount_cents
                                  )}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {formatCurrencyFromCents(
                                    summary.installment_total_cents
                                  )}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {formatCurrencyFromCents(
                                    summary.monthly_total_cents
                                  )}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                  {summary.item_count}
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
          </div>

          <aside className="order-1 flex min-w-0 flex-col gap-4 xl:sticky xl:top-6 xl:order-2 xl:self-start">
            <PurchaseForm
              key={dashboard.selectedPurchase?.id ?? "new"}
              cards={dashboard.cards}
              idPrefix="desktop-purchase"
              initialValues={formValues}
              isEditing={Boolean(dashboard.selectedPurchase)}
              returnTo={returnTo}
            />
            <MonthlyExpenseForm
              key={dashboard.selectedMonthlyExpense?.id ?? "new-monthly"}
              cards={dashboard.cards}
              idPrefix="desktop-monthly"
              initialValues={monthlyExpenseFormValues}
              isEditing={Boolean(dashboard.selectedMonthlyExpense)}
              returnTo={returnTo}
            />
          </aside>
        </section>
      </div>
    </div>
  )
}
