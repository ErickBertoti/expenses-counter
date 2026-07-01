"use client"

import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  formatCurrencyFromCents,
  getLineItemSourceLabel,
  getSourceSplitPercentages,
} from "@/lib/purchases"
import type { MonthlyBreakdown, MonthlySummary } from "@/lib/types"

type MonthlyAnalyticsProps = {
  breakdown: MonthlyBreakdown
  summaries: MonthlySummary[]
}

type TooltipPayload = {
  color?: string
  dataKey?: string
  name?: string
  payload?: Record<string, unknown>
  value?: number | string
}

type TooltipContentProps = {
  active?: boolean
  label?: string | number
  payload?: TooltipPayload[]
}

function formatChartValue(value: number | string | undefined) {
  return formatCurrencyFromCents(Number(value ?? 0))
}

function ChartTooltip({ active, label, payload }: TooltipContentProps) {
  if (!active || !payload?.length) {
    return null
  }

  const payloadLabel = payload[0]?.payload?.monthLabel
  const title =
    typeof payloadLabel === "string" ? payloadLabel : String(label ?? "Resumo")

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <div className="mb-2 font-medium text-popover-foreground">{title}</div>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => (
          <div
            key={`${entry.dataKey ?? entry.name}-${entry.value}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name ?? entry.dataKey}
            </span>
            <span className="font-medium tabular-nums text-popover-foreground">
              {formatChartValue(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartPanel({
  ariaLabel,
  caption,
  children,
  eyebrow,
  title,
  trailing,
}: {
  ariaLabel: string
  caption: string
  children: ReactNode
  eyebrow: string
  title: string
  trailing?: ReactNode
}) {
  return (
    <figure
      aria-label={ariaLabel}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <figcaption className="min-w-0">
          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {eyebrow}
          </div>
          <h3 className="mt-2 font-heading text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {caption}
          </p>
        </figcaption>
        {trailing}
      </div>
      {children}
    </figure>
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

function currencyLabel(value: unknown) {
  return formatCurrencyFromCents(Number(value))
}

export function MonthlyAnalytics({ breakdown, summaries }: MonthlyAnalyticsProps) {
  const split = getSourceSplitPercentages(breakdown)
  const trendItems = summaries
    .slice(0, 6)
    .toSorted((left, right) => left.month.localeCompare(right.month))
  const sourceSplitData = [
    {
      installments: breakdown.installment_total_cents,
      monthly: breakdown.monthly_total_cents,
      name: breakdown.month_label,
    },
  ]
  const cardData = breakdown.by_card.map((card) => ({
    name: card.card_name,
    total: card.total_amount_cents,
  }))
  const trendData = trendItems.map((summary) => ({
    month: summary.month.slice(5),
    monthLabel: summary.month_label,
    total: summary.total_amount_cents,
  }))
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
        caption="Mostra quanto do total vem de compras parceladas e quanto vem de mensalidades."
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
            <div className="mt-4 h-28" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sourceSplitData}
                  layout="vertical"
                  margin={{ bottom: 16, left: 0, right: 0, top: 16 }}
                >
                  <XAxis
                    type="number"
                    hide
                    domain={[0, breakdown.total_amount_cents]}
                  />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip content={<ChartTooltip />} cursor={false} />
                  <Bar
                    dataKey="installments"
                    fill="var(--chart-1)"
                    isAnimationActive={false}
                    name="Parceladas"
                    radius={[6, 0, 0, 6]}
                    stackId="month"
                  />
                  <Bar
                    dataKey="monthly"
                    fill="var(--chart-2)"
                    isAnimationActive={false}
                    name="Mensais"
                    radius={[0, 6, 6, 0]}
                    stackId="month"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
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
        caption="Compara os cartões que compõem o mês em foco."
        eyebrow="Por cartão"
        title="Origem do mês"
        trailing={
          <Badge variant="secondary">
            {formatCurrencyFromCents(breakdown.total_amount_cents)}
          </Badge>
        }
      >
        {cardData.length === 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <div
            className="mt-5"
            style={{ height: Math.max(190, cardData.length * 58) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cardData}
                layout="vertical"
                margin={{ bottom: 6, left: 0, right: 92, top: 6 }}
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                  type="category"
                  width={92}
                />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Bar
                  dataKey="total"
                  fill="var(--chart-3)"
                  isAnimationActive={false}
                  name="Total"
                  radius={[0, 6, 6, 0]}
                >
                  <LabelList
                    dataKey="total"
                    fill="var(--foreground)"
                    fontSize={11}
                    formatter={currencyLabel}
                    position="right"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartPanel>

      <ChartPanel
        ariaLabel={`Itens com maior peso em ${breakdown.month_label}`}
        caption="Lista os itens de maior valor para explicar o que mais pesa no mês."
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
        caption="Mostra a variação dos últimos meses disponíveis no resumo."
        eyebrow="Resumo"
        title="Tendência mensal"
      >
        {trendData.length === 0 ? (
          <div className="mt-4">
            <EmptyChartNote />
          </div>
        ) : (
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={trendData}
                margin={{ bottom: 4, left: 4, right: 4, top: 28 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  axisLine={false}
                  dataKey="month"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={false} />
                <Bar
                  dataKey="total"
                  fill="var(--chart-4)"
                  isAnimationActive={false}
                  name="Total"
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey="total"
                    fill="var(--foreground)"
                    fontSize={11}
                    formatter={currencyLabel}
                    position="top"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartPanel>
    </section>
  )
}
