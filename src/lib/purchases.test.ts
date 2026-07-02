import { describe, expect, it } from "vitest"

import {
  buildMonthlyBreakdowns,
  buildMonthlyExpenseWithCard,
  buildMonthlySummaries,
  buildPurchaseWithProgress,
  buildReturnToPath,
  filterMonthlyExpenses,
  filterPurchases,
  getInstallmentAmountForMonth,
  parseDashboardFilters,
  sanitizeRedirectPath,
} from "./purchases"
import type { MonthlyExpenseRecord, PurchaseRecord } from "./types"

function createPurchase(
  overrides: Partial<PurchaseRecord> = {}
): PurchaseRecord {
  return {
    id: "purchase-1",
    user_id: "user-1",
    card_id: "card-1",
    description: "Compra teste",
    purchase_date: "2025-01-10",
    first_installment_month: "2025-02-01",
    installment_count: 4,
    total_amount_cents: 40000,
    notes: null,
    is_disabled: false,
    created_at: "2025-01-10T00:00:00.000Z",
    updated_at: "2025-01-10T00:00:00.000Z",
    ...overrides,
  }
}

function createMonthlyExpense(
  overrides: Partial<MonthlyExpenseRecord> = {}
): MonthlyExpenseRecord {
  return {
    id: "monthly-1",
    user_id: "user-1",
    card_id: "card-1",
    description: "Academia",
    amount_cents: 12990,
    start_month: "2025-03-01",
    end_month: null,
    notes: null,
    is_disabled: false,
    created_at: "2025-01-10T00:00:00.000Z",
    updated_at: "2025-01-10T00:00:00.000Z",
    ...overrides,
  }
}

describe("purchase calculations", () => {
  it("counts already paid installments for an older purchase", () => {
    const purchase = createPurchase()
    const result = buildPurchaseWithProgress(
      purchase,
      "Cartão principal",
      "2025-04"
    )

    expect(result.paid_installments).toBe(2)
    expect(result.remaining_installments).toBe(2)
    expect(result.status).toBe("active")
    expect(result.remaining_amount_cents).toBe(20000)
  })

  it("marks a purchase as completed when all installments are in the past", () => {
    const purchase = createPurchase()
    const result = buildPurchaseWithProgress(
      purchase,
      "Cartão principal",
      "2025-07"
    )

    expect(result.paid_installments).toBe(4)
    expect(result.remaining_installments).toBe(0)
    expect(result.status).toBe("completed")
    expect(result.completion_month).toBe("2025-05")
  })

  it("keeps future purchases with zero paid installments", () => {
    const purchase = createPurchase({
      first_installment_month: "2026-03-01",
      installment_count: 6,
      total_amount_cents: 90000,
    })
    const result = buildPurchaseWithProgress(
      purchase,
      "Cartão principal",
      "2026-01"
    )

    expect(result.paid_installments).toBe(0)
    expect(result.remaining_installments).toBe(6)
    expect(result.remaining_amount_cents).toBe(90000)
  })

  it("places the leftover cents in the last installment", () => {
    const purchase = createPurchase({
      installment_count: 3,
      total_amount_cents: 1000,
    })
    const result = buildPurchaseWithProgress(
      purchase,
      "Cartão principal",
      "2025-02"
    )

    expect(result.installment_amounts_cents).toEqual([333, 333, 334])
    expect(getInstallmentAmountForMonth(result, "2025-04")).toBe(334)
  })

  it("aggregates monthly totals with overlapping purchases", () => {
    const purchases = [
      buildPurchaseWithProgress(
        createPurchase({
          id: "purchase-1",
          first_installment_month: "2025-02-01",
          installment_count: 3,
          total_amount_cents: 30000,
        }),
        "Cartão principal",
        "2025-03"
      ),
      buildPurchaseWithProgress(
        createPurchase({
          id: "purchase-2",
          description: "Compra 2",
          first_installment_month: "2025-03-01",
          installment_count: 2,
          total_amount_cents: 20000,
        }),
        "Cartão principal",
        "2025-03"
      ),
    ]

    const monthlySummary = buildMonthlySummaries(purchases)

    expect(monthlySummary).toEqual([
      {
        month: "2025-04",
        month_label: "Abril de 2025",
        installment_total_cents: 20000,
        monthly_total_cents: 0,
        total_amount_cents: 20000,
        item_count: 2,
        purchase_count: 2,
        installment_count: 2,
        monthly_expense_count: 0,
      },
      {
        month: "2025-03",
        month_label: "Março de 2025",
        installment_total_cents: 20000,
        monthly_total_cents: 0,
        total_amount_cents: 20000,
        item_count: 2,
        purchase_count: 2,
        installment_count: 2,
        monthly_expense_count: 0,
      },
      {
        month: "2025-02",
        month_label: "Fevereiro de 2025",
        installment_total_cents: 10000,
        monthly_total_cents: 0,
        total_amount_cents: 10000,
        item_count: 1,
        purchase_count: 1,
        installment_count: 1,
        monthly_expense_count: 0,
      },
    ])
  })

  it("keeps disabled purchases out of default filters and monthly totals", () => {
    const activePurchase = buildPurchaseWithProgress(
      createPurchase({
        id: "purchase-active",
        total_amount_cents: 30000,
      }),
      "Cartão principal",
      "2025-03"
    )
    const disabledPurchase = buildPurchaseWithProgress(
      createPurchase({
        id: "purchase-disabled",
        description: "Compra incerta",
        is_disabled: true,
        total_amount_cents: 90000,
      }),
      "Cartão principal",
      "2025-03"
    )

    expect(disabledPurchase.status).toBe("disabled")
    expect(
      filterPurchases([activePurchase, disabledPurchase], parseDashboardFilters({}))
        .map((purchase) => purchase.id)
    ).toEqual(["purchase-active"])
    expect(
      filterPurchases(
        [activePurchase, disabledPurchase],
        parseDashboardFilters({ status: "disabled" })
      ).map((purchase) => purchase.id)
    ).toEqual(["purchase-disabled"])

    expect(
      buildMonthlySummaries([activePurchase, disabledPurchase]).find(
        (summary) => summary.month === "2025-02"
      )
    ).toMatchObject({
      total_amount_cents: 7500,
      installment_total_cents: 7500,
    })
  })

  it("adds monthly expenses only inside their configured period", () => {
    const monthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        start_month: "2025-03-01",
        end_month: "2025-05-01",
        amount_cents: 12000,
      }),
      "Cartão principal"
    )

    const breakdowns = buildMonthlyBreakdowns({
      purchases: [],
      monthlyExpenses: [monthlyExpense],
      referenceMonthKey: "2025-03",
    })

    expect(breakdowns.map((breakdown) => breakdown.month)).toEqual([
      "2025-05",
      "2025-04",
      "2025-03",
    ])
    expect(breakdowns[0]).toMatchObject({
      monthly_expense_count: 1,
      monthly_total_cents: 12000,
      total_amount_cents: 12000,
    })
  })

  it("limits open-ended monthly expenses to a finite summary window", () => {
    const monthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        start_month: "2025-03-01",
        end_month: null,
        amount_cents: 10000,
      }),
      "Cartão principal"
    )

    const breakdowns = buildMonthlyBreakdowns({
      purchases: [],
      monthlyExpenses: [monthlyExpense],
      referenceMonthKey: "2025-03",
    })

    expect(breakdowns).toHaveLength(13)
    expect(breakdowns[0]?.month).toBe("2026-03")
    expect(breakdowns.at(-1)?.month).toBe("2025-03")
  })

  it("combines installment and monthly expenses in the same monthly summary", () => {
    const purchase = buildPurchaseWithProgress(
      createPurchase({
        first_installment_month: "2025-03-01",
        installment_count: 3,
        total_amount_cents: 1000,
      }),
      "Cartão principal",
      "2025-03"
    )
    const monthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        start_month: "2025-03-01",
        end_month: "2025-03-01",
        amount_cents: 12990,
      }),
      "Cartão principal"
    )

    expect(
      buildMonthlySummaries([purchase], [monthlyExpense], {
        referenceMonthKey: "2025-03",
      }).find((summary) => summary.month === "2025-03")
    ).toMatchObject({
      installment_total_cents: 333,
      monthly_total_cents: 12990,
      total_amount_cents: 13323,
      item_count: 2,
      installment_count: 1,
      monthly_expense_count: 1,
    })
  })

  it("filters disabled monthly expenses separately", () => {
    const activeMonthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({ id: "monthly-active" }),
      "Cartão principal"
    )
    const disabledMonthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        id: "monthly-disabled",
        is_disabled: true,
      }),
      "Cartão principal"
    )

    expect(
      filterMonthlyExpenses(
        [activeMonthlyExpense, disabledMonthlyExpense],
        parseDashboardFilters({})
      ).map((monthlyExpense) => monthlyExpense.id)
    ).toEqual(["monthly-active"])
    expect(
      filterMonthlyExpenses(
        [activeMonthlyExpense, disabledMonthlyExpense],
        parseDashboardFilters({ status: "disabled" })
      ).map((monthlyExpense) => monthlyExpense.id)
    ).toEqual(["monthly-disabled"])
  })

  it("defaults the dashboard view to purchases", () => {
    expect(parseDashboardFilters({})).toMatchObject({
      view: "purchases",
    })
  })

  it("reads the summary view from query params", () => {
    expect(
      parseDashboardFilters({
        view: "summary",
      })
    ).toMatchObject({
      view: "summary",
    })
  })

  it("reads the monthly view from query params", () => {
    expect(
      parseDashboardFilters({
        view: "monthly",
      })
    ).toMatchObject({
      view: "monthly",
    })
  })

  it("preserves a non-default view in the return path", () => {
    expect(
      buildReturnToPath(
        {
          query: "viagem",
          status: "active",
          month: "2025-03",
          cardId: "card-1",
          view: "summary",
        },
        {
          edit: "purchase-1",
        }
      )
    ).toBe(
      "/?q=viagem&status=active&month=2025-03&card=card-1&view=summary&edit=purchase-1"
    )
  })

  it("preserves monthly view and edit params in the return path", () => {
    expect(
      buildReturnToPath(
        {
          query: "",
          status: "disabled",
          month: "2025-03",
          cardId: "",
          view: "monthly",
        },
        {
          editMonthly: "monthly-1",
        }
      )
    ).toBe("/?status=disabled&month=2025-03&view=monthly&editMonthly=monthly-1")
  })
})

describe("redirect sanitization", () => {
  it("keeps internal app paths", () => {
    expect(sanitizeRedirectPath("/auth/update-password")).toBe(
      "/auth/update-password"
    )
    expect(sanitizeRedirectPath("/?view=summary")).toBe("/?view=summary")
  })

  it("rejects external and backslash-based redirects", () => {
    const decodedBackslashRedirect = new URL(
      "https://app.example/auth/confirm?next=/%5C%5Cattacker.example"
    ).searchParams.get("next")

    expect(sanitizeRedirectPath("https://attacker.example")).toBe("/")
    expect(sanitizeRedirectPath("//attacker.example")).toBe("/")
    expect(sanitizeRedirectPath("/\\attacker.example")).toBe("/")
    expect(sanitizeRedirectPath(decodedBackslashRedirect)).toBe("/")
  })
})
