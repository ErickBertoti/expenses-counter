import type {
  MonthlyBreakdown,
  MonthlyLineItem,
  MonthlySummary,
  PurchaseWithProgress,
} from "./types"
import {
  addMonthsToMonthKey,
  compareMonthKeys,
  formatMonthLabel,
} from "./purchases"
import type { MonthlyBreakdownRange } from "./purchases"

export type PurchaseRankingKey =
  | "installment"
  | "total"
  | "duration"
  | "remaining"

export type TimelinePoint = {
  month: string
  monthLabel: string
  shortLabel: string
  totalAmountCents: number
  installmentTotalCents: number
  monthlyTotalCents: number
  itemCount: number
  topItemDescription: string | null
  topItemAmountCents: number
  isCurrent: boolean
  isFocus: boolean
}

export type TimelineFutureRange = {
  startMonth: string
  endMonth: string
}

export type DashboardProjectionRange = MonthlyBreakdownRange

export type MonthlyImpactItem = {
  id: string
  description: string
  detail: string
  amountCents: number
  percentage: number
  isOther: boolean
}

export type PurchaseRankingItem = {
  id: string
  description: string
  cardName: string
  status: PurchaseWithProgress["status"]
  installmentAmountCents: number
  totalAmountCents: number
  remainingAmountCents: number
  installmentCount: number
  remainingInstallments: number
  completionMonth: string
}

export type DashboardAnalytics = {
  currentMonth: string
  timeline: TimelinePoint[]
  monthlyImpacts: MonthlyImpactItem[]
  rankings: Record<PurchaseRankingKey, PurchaseRankingItem[]>
  insights: {
    peak: TimelinePoint | null
    nextDrop: {
      fromMonth: string
      toMonth: string
      amountCents: number
      departingItems: string[]
    } | null
    monthlyBasePercentage: number
  }
  focusComposition: {
    totalAmountCents: number
    installmentAmountCents: number
    monthlyAmountCents: number
    installmentPercentage: number
    monthlyPercentage: number
  }
  cardComposition: MonthlyBreakdown["by_card"]
  monthlyRows: Array<{
    month: string
    monthLabel: string
    totalAmountCents: number
    installmentAmountCents: number
    monthlyAmountCents: number
    itemCount: number
    deltaAmountCents: number
    deltaPercentage: number | null
    topItemDescription: string | null
    topItemAmountCents: number
  }>
}

function getExactPercentage(value: number, total: number) {
  return total <= 0 ? 0 : Math.round((value / total) * 100)
}

export function getTimelineFutureRange(
  timeline: Pick<TimelinePoint, "month">[],
  currentMonth: string
): TimelineFutureRange | null {
  const currentIndex = timeline.findIndex((point) => point.month === currentMonth)
  const endMonth = timeline.at(-1)?.month

  if (currentIndex < 0 || !endMonth || currentIndex === timeline.length - 1) {
    return null
  }

  return { startMonth: currentMonth, endMonth }
}

export function getDashboardProjectionRange(
  currentMonth: string,
  focusMonth: string
): DashboardProjectionRange {
  const defaultStart = addMonthsToMonthKey(currentMonth, -3)
  const defaultEnd = addMonthsToMonthKey(currentMonth, 12)

  if (
    compareMonthKeys(focusMonth, defaultStart) < 0 ||
    compareMonthKeys(focusMonth, defaultEnd) > 0
  ) {
    return {
      startMonth: addMonthsToMonthKey(focusMonth, -3),
      endMonth: addMonthsToMonthKey(focusMonth, 12),
    }
  }

  return {
    startMonth: defaultStart,
    endMonth: defaultEnd,
  }
}

function getShortMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, monthNumber - 1, 1)))
    .replace(".", "")

  return `${label}/${String(year).slice(-2)}`
}

function lineItemDetail(item: MonthlyLineItem) {
  return item.source_type === "monthly_expense"
    ? "Mensalidade"
    : `Parcela ${item.installment_index}/${item.installment_count}`
}

function buildMonthlyImpacts(breakdown: MonthlyBreakdown) {
  const visible = breakdown.line_items.slice(0, 5)
  const remaining = breakdown.line_items.slice(5)
  const result: MonthlyImpactItem[] = visible.map((item) => ({
    id: item.id,
    description: item.description,
    detail: lineItemDetail(item),
    amountCents: item.amount_cents,
    percentage: getExactPercentage(item.amount_cents, breakdown.total_amount_cents),
    isOther: false,
  }))

  if (remaining.length > 0) {
    const amountCents = remaining.reduce(
      (total, item) => total + item.amount_cents,
      0
    )
    result.push({
      id: "other",
      description: "Outros",
      detail: `${remaining.length} itens restantes`,
      amountCents,
      percentage: getExactPercentage(amountCents, breakdown.total_amount_cents),
      isOther: true,
    })
  }

  return result
}

function rankingItem(purchase: PurchaseWithProgress): PurchaseRankingItem {
  return {
    id: purchase.id,
    description: purchase.description,
    cardName: purchase.card_name,
    status: purchase.status,
    installmentAmountCents: Math.max(...purchase.installment_amounts_cents, 0),
    totalAmountCents: purchase.total_amount_cents,
    remainingAmountCents: purchase.remaining_amount_cents,
    installmentCount: purchase.installment_count,
    remainingInstallments: purchase.remaining_installments,
    completionMonth: purchase.completion_month,
  }
}

function rankingValue(item: PurchaseRankingItem, key: PurchaseRankingKey) {
  if (key === "installment") return item.installmentAmountCents
  if (key === "total") return item.totalAmountCents
  if (key === "duration") return item.installmentCount
  return item.remainingAmountCents
}

export function buildPurchaseRankings(purchases: PurchaseWithProgress[]) {
  const items = purchases.map(rankingItem)
  const keys: PurchaseRankingKey[] = [
    "installment",
    "total",
    "duration",
    "remaining",
  ]

  return Object.fromEntries(
    keys.map((key) => [
      key,
      items
        .toSorted((left, right) => {
          const valueDifference = rankingValue(right, key) - rankingValue(left, key)
          if (valueDifference !== 0) return valueDifference
          const descriptionDifference = left.description.localeCompare(
            right.description,
            "pt-BR"
          )
          return descriptionDifference || left.id.localeCompare(right.id)
        })
        .slice(0, 5),
    ])
  ) as Record<PurchaseRankingKey, PurchaseRankingItem[]>
}

function buildTimeline({
  breakdowns,
  currentMonth,
  focusMonth,
}: {
  breakdowns: MonthlyBreakdown[]
  currentMonth: string
  focusMonth: string
}) {
  const byMonth = new Map(breakdowns.map((breakdown) => [breakdown.month, breakdown]))
  const { startMonth } = getDashboardProjectionRange(currentMonth, focusMonth)

  return Array.from({ length: 16 }, (_, index): TimelinePoint => {
    const month = addMonthsToMonthKey(startMonth, index)
    const breakdown = byMonth.get(month)
    const topItem = breakdown?.line_items[0]

    return {
      month,
      monthLabel: formatMonthLabel(month),
      shortLabel: getShortMonthLabel(month),
      totalAmountCents: breakdown?.total_amount_cents ?? 0,
      installmentTotalCents: breakdown?.installment_total_cents ?? 0,
      monthlyTotalCents: breakdown?.monthly_total_cents ?? 0,
      itemCount: breakdown?.item_count ?? 0,
      topItemDescription: topItem?.description ?? null,
      topItemAmountCents: topItem?.amount_cents ?? 0,
      isCurrent: month === currentMonth,
      isFocus: month === focusMonth,
    }
  })
}

function getPeak(timeline: TimelinePoint[], focusMonth: string) {
  const focusIndex = timeline.findIndex((point) => point.month === focusMonth)
  const candidates = timeline.filter((point) => point.totalAmountCents > 0)

  return (
    candidates.toSorted((left, right) => {
      const amountDifference = right.totalAmountCents - left.totalAmountCents
      if (amountDifference !== 0) return amountDifference
      const leftDistance = Math.abs(
        timeline.findIndex((point) => point.month === left.month) - focusIndex
      )
      const rightDistance = Math.abs(
        timeline.findIndex((point) => point.month === right.month) - focusIndex
      )
      return leftDistance - rightDistance || left.month.localeCompare(right.month)
    })[0] ?? null
  )
}

function getNextDrop(
  timeline: TimelinePoint[],
  focusMonth: string,
  breakdowns: MonthlyBreakdown[]
) {
  const startIndex = timeline.findIndex((point) => point.month === focusMonth)
  const breakdownByMonth = new Map(
    breakdowns.map((breakdown) => [breakdown.month, breakdown])
  )

  for (let index = Math.max(startIndex, 0); index < timeline.length - 1; index += 1) {
    const current = timeline[index]
    const next = timeline[index + 1]
    if (next.totalAmountCents >= current.totalAmountCents) continue

    const nextSourceIds = new Set(
      (breakdownByMonth.get(next.month)?.line_items ?? []).map(
        (item) => `${item.source_type}:${item.source_id}`
      )
    )
    const departingItems = (
      breakdownByMonth.get(current.month)?.line_items ?? []
    )
      .filter(
        (item) => !nextSourceIds.has(`${item.source_type}:${item.source_id}`)
      )
      .toSorted((left, right) => right.amount_cents - left.amount_cents)
      .slice(0, 2)
      .map((item) => item.description)

    return {
      fromMonth: current.month,
      toMonth: next.month,
      amountCents: current.totalAmountCents - next.totalAmountCents,
      departingItems,
    }
  }

  return null
}

export function buildDashboardAnalytics({
  breakdowns,
  currentMonth,
  focusBreakdown,
  focusMonth,
  purchases,
  summaries,
}: {
  breakdowns: MonthlyBreakdown[]
  currentMonth: string
  focusBreakdown: MonthlyBreakdown
  focusMonth: string
  purchases: PurchaseWithProgress[]
  summaries: MonthlySummary[]
}): DashboardAnalytics {
  const timeline = buildTimeline({ breakdowns, currentMonth, focusMonth })
  const total = focusBreakdown.total_amount_cents
  const installmentPercentage = getExactPercentage(
    focusBreakdown.installment_total_cents,
    total
  )
  const monthlyPercentage = total <= 0 ? 0 : 100 - installmentPercentage
  const summaryByMonth = new Map(summaries.map((summary) => [summary.month, summary]))
  const breakdownByMonth = new Map(
    breakdowns.map((breakdown) => [breakdown.month, breakdown])
  )
  const monthlyRows = summaries.map((summary) => {
    const previous = summaryByMonth.get(addMonthsToMonthKey(summary.month, -1))
    const deltaAmountCents =
      summary.total_amount_cents - (previous?.total_amount_cents ?? 0)
    const deltaPercentage =
      !previous || previous.total_amount_cents <= 0
        ? null
        : Math.round((deltaAmountCents / previous.total_amount_cents) * 100)
    const topItem = breakdownByMonth.get(summary.month)?.line_items[0]

    return {
      month: summary.month,
      monthLabel: summary.month_label,
      totalAmountCents: summary.total_amount_cents,
      installmentAmountCents: summary.installment_total_cents,
      monthlyAmountCents: summary.monthly_total_cents,
      itemCount: summary.item_count,
      deltaAmountCents,
      deltaPercentage,
      topItemDescription: topItem?.description ?? null,
      topItemAmountCents: topItem?.amount_cents ?? 0,
    }
  })

  return {
    currentMonth,
    timeline,
    monthlyImpacts: buildMonthlyImpacts(focusBreakdown),
    rankings: buildPurchaseRankings(purchases),
    insights: {
      peak: getPeak(timeline, focusMonth),
      nextDrop: getNextDrop(timeline, focusMonth, breakdowns),
      monthlyBasePercentage: monthlyPercentage,
    },
    focusComposition: {
      totalAmountCents: total,
      installmentAmountCents: focusBreakdown.installment_total_cents,
      monthlyAmountCents: focusBreakdown.monthly_total_cents,
      installmentPercentage,
      monthlyPercentage,
    },
    cardComposition: focusBreakdown.by_card,
    monthlyRows,
  }
}
