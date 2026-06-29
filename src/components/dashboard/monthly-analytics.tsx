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

function EmptyChartNote() {
  return (
    <p className="rounded-md border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
      Sem itens neste mês para montar gráficos.
    </p>
  )
}

export function MonthlyAnalytics({ breakdown, summaries }: MonthlyAnalyticsProps) {
  const split = getSourceSplitPercentages(breakdown)
  const trendItems = summaries
    .slice(0, 6)
    .toSorted((left, right) => left.month.localeCompare(right.month))
  const trendMax = getMonthlyTrendMax(trendItems)

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Gráfico do mês
            </div>
            <h3 className="mt-2 font-heading text-lg font-semibold">
              Parceladas x mensais
            </h3>
          </div>
          <Badge variant="outline">{breakdown.item_count} itens</Badge>
        </div>

        {breakdown.total_amount_cents <= 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
              <div className="flex h-full">
                <div
                  className="bg-primary"
                  style={{ width: `${split.installments}%` }}
                />
                <div
                  className="bg-[var(--chart-2)]"
                  style={{ width: `${split.monthly}%` }}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-muted p-3">
                <div className="text-xs text-muted-foreground">Parceladas</div>
                <div className="mt-1 font-semibold tabular-nums">
                  {formatCurrencyFromCents(breakdown.installment_total_cents)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {split.installments}% do mês
                </div>
              </div>
              <div className="rounded-md bg-muted p-3">
                <div className="text-xs text-muted-foreground">Mensais</div>
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
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Por cartão
            </div>
            <h3 className="mt-2 font-heading text-lg font-semibold">
              Origem do mês
            </h3>
          </div>
          <Badge variant="secondary">
            {formatCurrencyFromCents(breakdown.total_amount_cents)}
          </Badge>
        </div>

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
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
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
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          Top compras
        </div>
        <h3 className="mt-2 font-heading text-lg font-semibold">
          O que pesa neste mês
        </h3>

        {breakdown.top_items.length === 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {breakdown.top_items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-muted p-3"
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
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          Resumo
        </div>
        <h3 className="mt-2 font-heading text-lg font-semibold">
          Tendência mensal
        </h3>

        {trendItems.length === 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <div className="mt-5 flex h-44 items-end gap-2">
            {trendItems.map((summary) => (
              <div
                key={summary.month}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div className="flex h-32 w-full items-end rounded-md bg-muted px-1.5 py-1.5">
                  <div
                    className="w-full rounded-sm bg-primary"
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
      </div>
    </section>
  )
}
