import { describe, expect, it } from "vitest"

import { buildDashboardAnalytics } from "./analytics"
import {
  buildMonthlyBreakdowns,
  buildPurchaseWithProgress,
  emptyMonthlyBreakdown,
} from "./purchases"
import type { PurchaseRecord } from "./types"

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

function build(purchases: PurchaseRecord[], focusMonth = "2026-02") {
  const enriched = purchases.map((item) =>
    buildPurchaseWithProgress(item, "Cartão principal", "2026-02")
  )
  const breakdowns = buildMonthlyBreakdowns({
    purchases: enriched,
    monthlyExpenses: [],
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
    })
  })

  it("returns neutral insights without commitments", () => {
    const analytics = build([])

    expect(analytics.insights.peak).toBeNull()
    expect(analytics.insights.nextDrop).toBeNull()
    expect(analytics.insights.monthlyBasePercentage).toBe(0)
  })
})
