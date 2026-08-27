"use client"

import { useEffect, useRef, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { PurchaseStatusBadge } from "@/components/dashboard/purchase-status-badge"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type {
  DashboardAnalytics,
  PurchaseRankingItem,
  PurchaseRankingKey,
  TimelinePoint,
} from "@/lib/analytics"
import { resolveDashboardHref } from "@/lib/dashboard-url"
import {
  formatCurrencyFromCents,
  formatMonthLabel,
} from "@/lib/purchases"
import { cn } from "@/lib/utils"

type MonthlyAnalyticsProps = {
  analytics: DashboardAnalytics
  focusMonth: string
}

type TooltipPayload = { payload?: TimelinePoint }
type TooltipContentProps = { active?: boolean; payload?: TooltipPayload[] }

const rankingLabels: Record<PurchaseRankingKey, string> = {
  installment: "Maior parcela",
  total: "Maior total",
  duration: "Mais longa",
  remaining: "Maior saldo",
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: value >= 100_000 ? 0 : 1,
  }).format(value / 100)
}

function TimelineTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="min-w-56 rounded-md border border-border bg-popover p-3 text-xs shadow-lg">
      <div className="font-medium text-popover-foreground">{point.monthLabel}</div>
      <div className="mt-3 grid gap-2">
        <TooltipRow label="Total previsto" value={point.totalAmountCents} strong />
        <TooltipRow label="Parcelas" value={point.installmentTotalCents} />
        <TooltipRow label="Mensalidades" value={point.monthlyTotalCents} />
      </div>
      <div className="mt-3 border-t border-border pt-2 text-muted-foreground">
        {point.itemCount} {point.itemCount === 1 ? "item" : "itens"}
        {point.topItemDescription ? (
          <span className="mt-1 block text-popover-foreground">
            Maior impacto: {point.topItemDescription} ·{" "}
            {formatCurrencyFromCents(point.topItemAmountCents)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function TooltipRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: number
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", strong && "font-semibold")}>
        {formatCurrencyFromCents(value)}
      </span>
    </div>
  )
}

function InsightCard({
  eyebrow,
  value,
  helper,
}: {
  eyebrow: string
  value: string
  helper: string
}) {
  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {eyebrow}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
    </article>
  )
}

function rankingValue(item: PurchaseRankingItem, key: PurchaseRankingKey) {
  if (key === "installment") return formatCurrencyFromCents(item.installmentAmountCents)
  if (key === "total") return formatCurrencyFromCents(item.totalAmountCents)
  if (key === "remaining") return formatCurrencyFromCents(item.remainingAmountCents)
  return `${item.installmentCount} meses`
}

function rankingHelper(item: PurchaseRankingItem, key: PurchaseRankingKey) {
  if (key === "duration") {
    return `${item.remainingInstallments} restantes · termina em ${formatMonthLabel(item.completionMonth)}`
  }
  if (key === "remaining") {
    return `${item.remainingInstallments} parcelas restantes`
  }
  if (key === "installment") {
    return `${item.installmentCount} parcelas · ${item.cardName}`
  }
  return `${item.installmentCount} parcelas · ${formatCurrencyFromCents(item.remainingAmountCents)} restantes`
}

function PurchaseRanking({ analytics }: { analytics: DashboardAnalytics }) {
  const [criterion, setCriterion] = useState<PurchaseRankingKey>("installment")
  const items = analytics.rankings[criterion]
  const maxValue = items.reduce((max, item) => {
    const value =
      criterion === "installment"
        ? item.installmentAmountCents
        : criterion === "total"
          ? item.totalAmountCents
          : criterion === "duration"
            ? item.installmentCount
            : item.remainingAmountCents
    return Math.max(max, value)
  }, 0)

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div>
        <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          Comparar compras
        </div>
        <h3 className="mt-2 font-heading text-lg font-semibold">Onde está o compromisso</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Compara todo o portfólio visível, sem limitar ao mês em foco.
        </p>
      </div>

      <div
        className="mt-4 grid grid-cols-2 gap-1 rounded-md bg-muted p-1 sm:grid-cols-4"
        role="tablist"
        aria-label="Critério do ranking de compras"
      >
        {(Object.keys(rankingLabels) as PurchaseRankingKey[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={criterion === key}
            onClick={() => setCriterion(key)}
            className={cn(
              "rounded-sm px-2 py-2 text-xs font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none",
              criterion === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {rankingLabels[key]}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
          Nenhuma compra disponível para comparar.
        </p>
      ) : (
        <ol className="mt-4 grid gap-2">
          {items.map((item, index) => {
            const value =
              criterion === "installment"
                ? item.installmentAmountCents
                : criterion === "total"
                  ? item.totalAmountCents
                  : criterion === "duration"
                    ? item.installmentCount
                    : item.remainingAmountCents
            const width = maxValue <= 0 ? 0 : Math.max(4, (value / maxValue) * 100)

            return (
              <li key={item.id} className="relative overflow-hidden rounded-md border border-border p-3">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-[var(--chart-1)]/10"
                  style={{ width: `${width}%` }}
                />
                <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">{item.description}</span>
                      <PurchaseStatusBadge status={item.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {rankingHelper(item, criterion)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {rankingValue(item, criterion)}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export function MonthlyAnalytics({ analytics, focusMonth }: MonthlyAnalyticsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const scrollRef = useRef<HTMLDivElement>(null)
  const searchParamsString = searchParams.toString()
  const focus = analytics.timeline.find((point) => point.isFocus)
  const current = analytics.timeline.find((point) => point.isCurrent)
  const futureStart = current?.month ?? analytics.timeline[0]?.month

  function selectMonth(month: string) {
    if (!month || month === focusMonth) return
    router.replace(resolveDashboardHref(pathname, searchParamsString, { month }), {
      scroll: false,
    })
  }

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const focusIndex = analytics.timeline.findIndex((point) => point.isFocus)
    if (focusIndex < 0) return
    const pointWidth = 52
    container.scrollLeft = Math.max(
      0,
      focusIndex * pointWidth - container.clientWidth / 2 + pointWidth / 2
    )
  }, [analytics.timeline])

  const peak = analytics.insights.peak
  const nextDrop = analytics.insights.nextDrop
  const composition = analytics.focusComposition

  return (
    <section aria-label="Painel de compromissos previstos" className="grid gap-4">
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Evolução prevista
            </div>
            <h2 className="mt-2 font-heading text-xl font-semibold">Compromissos por mês</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Parcelas e mensalidades programadas. Os valores não representam conciliação da fatura.
            </p>
          </div>
          <label className="grid w-full gap-1.5 text-xs font-medium text-muted-foreground sm:w-44">
            Mês em foco
            <Input
              type="month"
              value={focusMonth}
              onChange={(event) => selectMonth(event.target.value)}
              className="bg-background text-foreground"
            />
          </label>
        </div>

        {analytics.timeline.every((point) => point.totalAmountCents === 0) ? (
          <div className="p-4">
            <p className="rounded-md border border-dashed border-border bg-muted p-5 text-sm text-muted-foreground">
              Sem compromissos previstos nesta janela.
            </p>
          </div>
        ) : (
          <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain px-2 pt-5 pb-2">
            <div className="h-72 min-w-[52rem]" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.timeline}
                  margin={{ bottom: 10, left: 4, right: 24, top: 12 }}
                  onClick={(state) => {
                    const month = state?.activeLabel
                    if (typeof month === "string") selectMonth(month)
                  }}
                >
                  {futureStart ? (
                    <ReferenceArea
                      x1={futureStart}
                      x2={analytics.timeline.at(-1)?.month}
                      fill="var(--chart-2)"
                      fillOpacity={0.05}
                    />
                  ) : null}
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    tickLine={false}
                    tickFormatter={(_, index) => analytics.timeline[index]?.shortLabel ?? ""}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={66}
                    tickFormatter={(value) => formatCompactCurrency(Number(value))}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  {current ? (
                    <ReferenceLine
                      x={current.month}
                      stroke="var(--foreground)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.45}
                      label={{
                        value: "Hoje",
                        position: "insideTopRight",
                        fill: "var(--muted-foreground)",
                        fontSize: 10,
                      }}
                    />
                  ) : null}
                  <Tooltip content={<TimelineTooltip />} cursor={{ stroke: "var(--border)" }} />
                  <Line
                    type="monotone"
                    dataKey="totalAmountCents"
                    name="Total previsto"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    isAnimationActive={false}
                    activeDot={{
                      r: 5,
                      fill: "var(--background)",
                      stroke: "var(--chart-1)",
                      strokeWidth: 3,
                    }}
                    dot={(props) => {
                      const point = props.payload as TimelinePoint
                      const highlighted =
                        point.isFocus || point.isCurrent || point.month === peak?.month
                      return (
                        <circle
                          key={point.month}
                          cx={props.cx}
                          cy={props.cy}
                          r={highlighted ? 4 : 2}
                          fill={highlighted ? "var(--background)" : "var(--chart-1)"}
                          stroke="var(--chart-1)"
                          strokeWidth={highlighted ? 2.5 : 1}
                        />
                      )
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="border-t border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-medium">
                Composição de {focus?.monthLabel ?? formatMonthLabel(focusMonth)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCurrencyFromCents(composition.totalAmountCents)} previstos no total.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                <i className="mr-1.5 inline-block size-2 rounded-full bg-[var(--chart-1)]" />
                Parcelas {composition.installmentPercentage}%
              </span>
              <span>
                <i className="mr-1.5 inline-block size-2 rounded-full bg-[var(--chart-2)]" />
                Mensais {composition.monthlyPercentage}%
              </span>
            </div>
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span
              className="bg-[var(--chart-1)]"
              style={{ width: `${composition.installmentPercentage}%` }}
            />
            <span
              className="bg-[var(--chart-2)]"
              style={{ width: `${composition.monthlyPercentage}%` }}
            />
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div className="flex justify-between gap-3 rounded-md bg-muted px-3 py-2">
              <span className="text-muted-foreground">Parcelas</span>
              <span className="font-medium tabular-nums">
                {formatCurrencyFromCents(composition.installmentAmountCents)}
              </span>
            </div>
            <div className="flex justify-between gap-3 rounded-md bg-muted px-3 py-2">
              <span className="text-muted-foreground">Mensalidades</span>
              <span className="font-medium tabular-nums">
                {formatCurrencyFromCents(composition.monthlyAmountCents)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <InsightCard
          eyebrow="Pico da janela"
          value={peak ? formatCurrencyFromCents(peak.totalAmountCents) : "Sem compromissos"}
          helper={
            peak
              ? `${peak.monthLabel} · ${peak.itemCount} itens previstos`
              : "Nenhum mês possui valor previsto."
          }
        />
        <InsightCard
          eyebrow="Próxima redução"
          value={
            nextDrop
              ? `− ${formatCurrencyFromCents(nextDrop.amountCents)}`
              : "Sem queda prevista"
          }
          helper={
            nextDrop
              ? `${formatMonthLabel(nextDrop.toMonth)}${nextDrop.departingItems.length ? ` · saem ${nextDrop.departingItems.join(" e ")}` : ""}`
              : "O total não diminui nos meses seguintes da janela."
          }
        />
        <InsightCard
          eyebrow="Base mensal"
          value={
            composition.totalAmountCents > 0
              ? `${analytics.insights.monthlyBasePercentage}%`
              : "Sem compromissos"
          }
          helper={
            composition.totalAmountCents > 0
              ? `${formatCurrencyFromCents(composition.monthlyAmountCents)} vêm de mensalidades.`
              : "Cadastre uma compra ou mensalidade para calcular."
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Impacto no mês
          </div>
          <h3 className="mt-2 font-heading text-lg font-semibold">
            O que pesa em {focus?.monthLabel ?? formatMonthLabel(focusMonth)}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Valores das parcelas e mensalidades que compõem o mês em foco.
          </p>

          {analytics.monthlyImpacts.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
              Sem itens previstos neste mês.
            </p>
          ) : (
            <ol className="mt-4 grid gap-2">
              {analytics.monthlyImpacts.map((item, index) => (
                <li key={item.id} className="relative overflow-hidden rounded-md border border-border p-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-0 left-0",
                      item.isOther ? "bg-muted" : "bg-[var(--chart-2)]/15"
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                  <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{item.description}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.detail} · {item.percentage}% do mês
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatCurrencyFromCents(item.amountCents)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <PurchaseRanking analytics={analytics} />
      </div>

      {analytics.cardComposition.length > 1 ? (
        <details className="group rounded-lg border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium">
            Origem por cartão
            <Badge variant="outline">{analytics.cardComposition.length} cartões</Badge>
          </summary>
          <div className="grid gap-3 border-t border-border p-4">
            {analytics.cardComposition.map((card) => {
              const percentage =
                composition.totalAmountCents <= 0
                  ? 0
                  : Math.round(
                      (card.total_amount_cents / composition.totalAmountCents) * 100
                    )
              return (
                <div key={card.card_id}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span>{card.card_name}</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrencyFromCents(card.total_amount_cents)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-[var(--chart-1)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </details>
      ) : null}

      <div className="sr-only">
        <h3>Valores mensais previstos</h3>
        <ul>
          {analytics.timeline.map((point) => (
            <li key={point.month}>
              {point.monthLabel}: {formatCurrencyFromCents(point.totalAmountCents)},
              com {formatCurrencyFromCents(point.installmentTotalCents)} em parcelas e{" "}
              {formatCurrencyFromCents(point.monthlyTotalCents)} em mensalidades.
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
