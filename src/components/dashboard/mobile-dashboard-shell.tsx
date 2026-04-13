"use client"

import Link from "next/link"
import { useState } from "react"
import {
  CalendarRangeIcon,
  ChevronDownIcon,
  ListFilterIcon,
  PencilLineIcon,
  PlusIcon,
  SearchXIcon,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { signOut } from "@/app/actions"
import { DeletePurchaseButton } from "@/components/dashboard/delete-purchase-button"
import { PurchaseFilters } from "@/components/dashboard/purchase-filters"
import { PurchaseForm } from "@/components/dashboard/purchase-form"
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
} from "@/lib/purchases"
import type {
  DashboardView,
  PurchaseFormValues,
  PurchaseWithProgress,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type MobileDashboardShellProps = {
  dashboard: DashboardData
  focusColumnLabel: string
  formValues: PurchaseFormValues
  returnTo: string
}

type DashboardBaseFilters = {
  cardId: string
  month: string
  query: string
  status: "all" | PurchaseWithProgress["status"]
  view: DashboardView
}

function statusBadgeVariant(status: PurchaseWithProgress["status"]) {
  return status === "active" ? "default" : "secondary"
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
    <article className="min-w-[15rem] snap-start rounded-[24px] border border-border/70 bg-background/92 p-4 shadow-sm">
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-heading text-2xl font-semibold tabular-nums">
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
    <article className="rounded-[24px] border border-border/70 bg-background/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 truncate text-sm font-medium">
              {purchase.description}
            </h3>
            <Badge variant={statusBadgeVariant(purchase.status)}>
              {purchase.status === "active" ? "Em andamento" : "Concluída"}
            </Badge>
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
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Saldo
          </div>
          <div className="mt-1 text-sm font-semibold tabular-nums">
            {formatCurrencyFromCents(purchase.remaining_amount_cents)}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-muted/35 p-3 text-sm">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Progresso
          </div>
          <div className="mt-1 font-medium tabular-nums">
            {purchase.paid_installments}/{purchase.installment_count}
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Parcela em foco
          </div>
          <div className="mt-1 truncate font-medium" title={focusColumnLabel}>
            {monthAmount === null
              ? "Sem parcela"
              : formatCurrencyFromCents(monthAmount)}
          </div>
        </div>
      </div>

      <details className="group mt-3 rounded-2xl border border-border/60 bg-background/85">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-sm text-muted-foreground">
          <span>Ver detalhes</span>
          <ChevronDownIcon
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <dl className="grid gap-2 border-t border-border/60 px-3 py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Compra</dt>
            <dd>{formatDateLabel(purchase.purchase_date)}</dd>
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
            <dd>{formatCurrencyFromCents(purchase.total_amount_cents)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Saldo restante</dt>
            <dd>{formatCurrencyFromCents(purchase.remaining_amount_cents)}</dd>
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
        <DeletePurchaseButton
          className="shrink-0"
          description={purchase.description}
          purchaseId={purchase.id}
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
  purchase_count,
  total_amount_cents,
  installment_count,
}: DashboardData["monthlySummaries"][number] & {
  isFocusMonth: boolean
}) {
  return (
    <article className="rounded-[24px] border border-border/70 bg-background/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">{month_label}</h3>
            {isFocusMonth ? <Badge variant="secondary">Em foco</Badge> : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {purchase_count} compras e {installment_count} parcelas
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
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

export function MobileDashboardShell({
  dashboard,
  focusColumnLabel,
  formValues,
  returnTo,
}: MobileDashboardShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const compose = searchParams.get("compose") === "1"
  const editId = searchParams.get("edit")
  const isEditing = Boolean(
    dashboard.selectedPurchase && editId === dashboard.selectedPurchase.id
  )
  const purchaseSheetOpen = compose || isEditing
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
  const purchasesViewHref = buildReturnToPath({
    ...filtersBase,
    view: "purchases",
  })
  const summaryViewHref = buildReturnToPath({
    ...filtersBase,
    view: "summary",
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
      ? "Somente ativas"
      : dashboard.filters.status === "completed"
        ? "Somente concluídas"
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
      <section className="rounded-[28px] border border-border/70 bg-background/92 p-4 shadow-sm backdrop-blur">
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

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <Link
            href={newPurchaseHref}
            scroll={false}
            className={cn(
              buttonVariants({
                size: "lg",
              }),
              "w-full"
            )}
          >
            <PlusIcon data-icon="inline-start" />
            Nova compra
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
          helper={`${dashboard.focusSummary.installment_count} parcelas previstas`}
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
      </section>

      <section className="rounded-[28px] border border-border/70 bg-background/90 p-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-[20px] border border-border/70 bg-muted/35 p-1">
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
          {dashboard.monthlySummaries.length === 0 ? (
            <Empty className="rounded-[28px] border border-dashed border-border bg-background/80 p-6">
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
      ) : (
        <section className="flex flex-col gap-3">
          {dashboard.purchases.length === 0 ? (
            <Empty className="rounded-[28px] border border-dashed border-border bg-background/80 p-6">
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
    </div>
  )
}
