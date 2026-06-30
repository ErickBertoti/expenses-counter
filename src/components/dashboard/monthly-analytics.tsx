import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import {
  formatCurrencyFromCents,
  getLineItemSourceLabel,
  getMonthlyTrendMax,
  getProgressPercentage,
  getSourceSplitPercentages,
} from "@/lib/purchases"
import type { MonthlyBreakdown, MonthlySummary } from "@/lib/types"

type MonthlyAnalyticsProps = {
  breakdown: MonthlyBreakdown
  summaries: MonthlySummary[]
}

function ChartPanel({
  ariaLabel,
  children,
  eyebrow,
  title,
  trailing,
}: {
  ariaLabel: string
  children: ReactNode
  eyebrow: string
  title: string
  trailing?: ReactNode
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="rounded-lg border border-border bg-card p-4"
      role="group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </div>
          <h3 className="mt-2 font-heading text-lg font-semibold">{title}</h3>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  )
}

function EmptyChartNote() {
  return (
    <p className="rounded-md border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
      Sem itens neste mês para montar gráficos.
    </p>
  )
}

function ChartLegendDot({ className }: { className: string }) {
  return <span aria-hidden="true" className={`size-2.5 rounded-full ${className}`} />
}

export function MonthlyAnalytics({ breakdown, summaries }: MonthlyAnalyticsProps) {
  const split = getSourceSplitPercentages(breakdown)
  const trendItems = summaries
    .slice(0, 6)
    .toSorted((left, right) => left.month.localeCompare(right.month))
  const trendMax = getMonthlyTrendMax(trendItems)
  const summaryLabel = `${breakdown.month_label}: ${formatCurrencyFromCents(
    breakdown.total_amount_cents
  )} em ${breakdown.item_count} itens, com ${formatCurrencyFromCents(
    breakdown.installment_total_cents
  )} em parcelas e ${formatCurrencyFromCents(
    breakdown.monthly_total_cents
  )} em mensalidades.`

  return (
    <section
      aria-label={`Análise mensal de ${breakdown.month_label}`}
      className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
    >
      <div className="rounded-lg border border-border bg-card p-4 xl:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Resumo visual
            </div>
            <h2 className="mt-2 font-heading text-xl font-semibold">
              {breakdown.month_label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {summaryLabel}
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {breakdown.item_count} itens
          </Badge>
        </div>
      </div>

      <ChartPanel
        ariaLabel={`Divisão do mês entre parcelas e mensalidades. ${summaryLabel}`}
        eyebrow="Gráfico do mês"
        title="Parceladas x mensais"
        trailing={<Badge variant="outline">{breakdown.item_count} itens</Badge>}
      >
        {breakdown.total_amount_cents <= 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="mt-5 h-6 overflow-hidden rounded-md bg-muted ring-1 ring-border"
            >
              <div className="flex h-full">
                <div
                  className="bg-[var(--chart-1)]"
                  style={{ width: `${split.installments}%` }}
                />
                <div
                  className="bg-[var(--chart-2)]"
                  style={{ width: `${split.monthly}%` }}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-muted p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ChartLegendDot className="bg-[var(--chart-1)]" />
                  Parceladas
                </div>
                <div className="mt-1 font-semibold tabular-nums">
                  {formatCurrencyFromCents(breakdown.installment_total_cents)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {split.installments}% do mês
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ChartLegendDot className="bg-[var(--chart-2)]" />
                  Mensais
                </div>
                <div className="mt-1 font-semibold tabular-nums">
                  {formatCurrencyFromCents(breakdown.monthly_total_cents)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {split.monthly}% do mês
                </div>
              </div>
            </div>
          </>
        )}
      </ChartPanel>

      <ChartPanel
        ariaLabel={`Total do mês por cartão em ${breakdown.month_label}`}
        eyebrow="Por cartão"
        title="Origem do mês"
        trailing={
          <Badge variant="secondary">
            {formatCurrencyFromCents(breakdown.total_amount_cents)}
          </Badge>
        }
      >

        {breakdown.by_card.length === 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {breakdown.by_card.map((card) => (
              <div key={card.card_id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{card.card_name}</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrencyFromCents(card.total_amount_cents)}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-4 overflow-hidden rounded-md bg-muted ring-1 ring-border"
                >
                  <div
                    className="h-full rounded-md bg-[var(--chart-3)]"
                    style={{
                      width: `${getProgressPercentage(
                        card.total_amount_cents,
                        breakdown.total_amount_cents
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartPanel>

      <ChartPanel
        ariaLabel={`Itens com maior peso em ${breakdown.month_label}`}
        eyebrow="Top itens"
        title="O que pesa neste mês"
      >
        {breakdown.top_items.length === 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {breakdown.top_items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-border bg-muted p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {item.description}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.card_name}</span>
                    <Badge variant="outline">{getLineItemSourceLabel(item)}</Badge>
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  {formatCurrencyFromCents(item.amount_cents)}
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartPanel>

      <ChartPanel
        ariaLabel={`Tendência mensal recente até ${breakdown.month_label}`}
        eyebrow="Resumo"
        title="Tendência mensal"
      >
        {trendItems.length === 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <div className="mt-5 flex h-52 items-end gap-2">
            {trendItems.map((summary) => (
              <div
                key={summary.month}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div className="w-full truncate text-center text-[11px] font-medium tabular-nums">
                  {formatCurrencyFromCents(summary.total_amount_cents)}
                </div>
                <div
                  aria-hidden="true"
                  className="flex h-36 w-full items-end rounded-md bg-muted px-1.5 py-1.5 ring-1 ring-border"
                >
                  <div
                    className="w-full rounded-sm bg-[var(--chart-4)]"
                    style={{
                      height: `${getProgressPercentage(
                        summary.total_amount_cents,
                        trendMax
                      )}%`,
                    }}
                  />
                </div>
                <div className="w-full truncate text-center text-[11px] text-muted-foreground">
                  {summary.month.slice(5)}
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartPanel>
    </section>
  )
}
