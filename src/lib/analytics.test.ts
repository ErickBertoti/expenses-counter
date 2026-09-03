import { describe, expect, it } from "vitest"

import { buildDashboardAnalytics, getTimelineFutureRange } from "./analytics"
import {
  buildMonthlyBreakdowns,
  buildMonthlyExpenseWithCard,
  buildPurchaseWithProgress,
  emptyMonthlyBreakdown,
} from "./purchases"
import type { MonthlyExpenseRecord, PurchaseRecord } from "./types"

function purchase(overrides: Partial<PurchaseRecord> = {}): PurchaseRecord {
  return {
    id: "purchase-1",
    user_id: "user-1",
    card_id: "card-1",
    description: "Notebook",
    purchase_date: "2026-01-10",
    first_installment_month: "2026-02-01",
    installment_count: 3,
    total_amount_cents: 1000,
    notes: null,
    is_disabled: false,
    created_at: "2026-01-10T00:00:00.000Z",
    updated_at: "2026-01-10T00:00:00.000Z",
    ...overrides,
  }
}

function monthlyExpense(
  overrides: Partial<MonthlyExpenseRecord> = {}
): MonthlyExpenseRecord {
  return {
    id: "monthly-1",
    user_id: "user-1",
    card_id: "card-1",
    description: "Academia",
    amount_cents: 99,
    start_month: "2026-02-01",
    end_month: "2026-02-01",
    notes: null,
    is_disabled: false,
    created_at: "2026-01-10T00:00:00.000Z",
    updated_at: "2026-01-10T00:00:00.000Z",
    ...overrides,
  }
}

function build(
  purchases: PurchaseRecord[],
  focusMonth = "2026-02",
  monthlyExpenses: MonthlyExpenseRecord[] = []
) {
  const enriched = purchases.map((item) =>
    buildPurchaseWithProgress(item, "Cartão principal", "2026-02")
  )
  const enrichedMonthlyExpenses = monthlyExpenses.map((item) =>
    buildMonthlyExpenseWithCard(item, "Cartão principal")
  )
  const breakdowns = buildMonthlyBreakdowns({
    purchases: enriched,
    monthlyExpenses: enrichedMonthlyExpenses,
    focusMonth,
    referenceMonthKey: "2026-02",
  })
  const focusBreakdown =
    breakdowns.find((item) => item.month === focusMonth) ??
    emptyMonthlyBreakdown(focusMonth)

  return buildDashboardAnalytics({
    breakdowns,
    currentMonth: "2026-02",
    focusBreakdown,
    focusMonth,
    purchases: enriched,
    summaries: [],
  })
}

describe("dashboard analytics", () => {
  it("builds a zero-filled 16 month window", () => {
    const analytics = build([purchase()])

    expect(analytics.timeline).toHaveLength(16)
    expect(analytics.timeline[0]?.month).toBe("2025-11")
    expect(analytics.timeline.at(-1)?.month).toBe("2027-02")
    expect(analytics.timeline.find((item) => item.month === "2026-02")).toMatchObject({
      totalAmountCents: 333,
      isCurrent: true,
      isFocus: true,
    })
    expect(analytics.timeline.find((item) => item.month === "2026-05")?.totalAmountCents).toBe(0)
    expect(analytics.timeline.find((item) => item.month === "2026-02")?.shortLabel).toMatch(/\/26$/)
  })

  it("recenters the window when focus is outside the default range", () => {
    const analytics = build([purchase()], "2028-06")

    expect(analytics.timeline[0]?.month).toBe("2028-03")
    expect(analytics.timeline.at(-1)?.month).toBe("2029-06")
  })

  it("uses the largest split installment and stable ranking criteria", () => {
    const analytics = build([
      purchase(),
      purchase({
        id: "purchase-2",
        description: "Curso",
        installment_count: 2,
        total_amount_cents: 2000,
      }),
    ])

    expect(analytics.rankings.installment[0]).toMatchObject({
      description: "Curso",
      installmentAmountCents: 1000,
    })
    expect(analytics.rankings.duration[0]?.description).toBe("Notebook")
    expect(analytics.rankings.total[0]?.description).toBe("Curso")
  })

  it("keeps residual cents in rankings and zeroes completed balances", () => {
    const analytics = build([
      purchase({ id: "residual", description: "Residual", total_amount_cents: 1000 }),
      purchase({
        id: "completed",
        description: "Concluída",
        first_installment_month: "2025-01-01",
        installment_count: 1,
        total_amount_cents: 100,
      }),
    ])

    expect(analytics.rankings.installment.find((item) => item.id === "residual"))
      .toMatchObject({ installmentAmountCents: 334 })
    expect(analytics.rankings.remaining.find((item) => item.id === "completed"))
      .toMatchObject({ remainingAmountCents: 0, remainingInstallments: 0 })
    expect(analytics.rankings.remaining.at(-1)?.id).toBe("completed")
  })

  it("finds the peak and next net drop", () => {
    const analytics = build([
      purchase(),
      purchase({
        id: "purchase-2",
        description: "Curso",
        first_installment_month: "2026-03-01",
        installment_count: 1,
        total_amount_cents: 5000,
      }),
    ])

    expect(analytics.insights.peak?.month).toBe("2026-03")
    expect(analytics.insights.nextDrop).toMatchObject({
      fromMonth: "2026-03",
      toMonth: "2026-04",
      amountCents: 4999,
    })
    expect(analytics.insights.nextDrop?.departingItems).toContain("Curso")
  })

  it("groups monthly impacts after the top five", () => {
    const analytics = build(
      Array.from({ length: 7 }, (_, index) =>
        purchase({
          id: `purchase-${index}`,
          description: `Compra ${index}`,
          installment_count: 1,
          total_amount_cents: (index + 1) * 100,
        })
      )
    )

    expect(analytics.monthlyImpacts).toHaveLength(6)
    expect(analytics.monthlyImpacts.at(-1)).toMatchObject({
      description: "Outros",
      isOther: true,
      amountCents: 300,
      percentage: 11,
    })
  })

  it("keeps analytics percentages exact for zero, full and tiny sources", () => {
    const onlyMonthly = build([], "2026-02", [monthlyExpense()])
    expect(onlyMonthly.focusComposition).toMatchObject({
      totalAmountCents: 99,
      installmentPercentage: 0,
      monthlyPercentage: 100,
    })
    expect(onlyMonthly.monthlyImpacts[0]?.percentage).toBe(100)

    const onlyInstallment = build([
      purchase({ installment_count: 1, total_amount_cents: 100 }),
    ])
    expect(onlyInstallment.focusComposition).toMatchObject({
      totalAmountCents: 100,
      installmentPercentage: 100,
      monthlyPercentage: 0,
    })

    const tinyInstallment = build(
      [purchase({ installment_count: 1, total_amount_cents: 1 })],
      "2026-02",
      [monthlyExpense({ amount_cents: 99 })]
    )
    expect(tinyInstallment.focusComposition).toMatchObject({
      installmentPercentage: 1,
      monthlyPercentage: 99,
    })
    expect(
      tinyInstallment.monthlyImpacts.find((item) => item.description === "Notebook")?.percentage
    ).toBe(1)
  })

  it("calculates the future range for historical, current and future windows", () => {
    const timeline = [
      { month: "2025-01" },
      { month: "2025-02" },
      { month: "2025-03" },
    ]

    expect(getTimelineFutureRange(timeline, "2024-12")).toEqual({
      startMonth: "2025-01",
      endMonth: "2025-03",
    })
    expect(getTimelineFutureRange(timeline, "2025-02")).toEqual({
      startMonth: "2025-02",
      endMonth: "2025-03",
    })
    expect(getTimelineFutureRange(timeline, "2025-04")).toBeNull()
  })

  it("returns neutral insights without commitments", () => {
    const analytics = build([])

    expect(analytics.insights.peak).toBeNull()
    expect(analytics.insights.nextDrop).toBeNull()
    expect(analytics.insights.monthlyBasePercentage).toBe(0)
  })

  it("returns no future drop for a stable monthly commitment", () => {
    const analytics = build([], "2026-02", [monthlyExpense({ end_month: null })])

    expect(analytics.insights.nextDrop).toBeNull()
  })
})
