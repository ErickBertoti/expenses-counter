import { describe, expect, it } from "vitest"

import {
  buildMonthlyBreakdowns,
  buildMonthlyExpenseWithCard,
  buildPurchaseWithProgress,
  emptyMonthlyBreakdown,
  filterPurchases,
  formatCurrencyFromCents,
  parseDashboardFilters,
} from "./purchases"
import {
  buildMonthlyExportModel,
  buildMonthlyExportText,
  getMonthlyExportFileName,
} from "./monthly-export"
import type { MonthlyExpenseRecord, PurchaseRecord } from "./types"

function createPurchase(
  overrides: Partial<PurchaseRecord> = {}
): PurchaseRecord {
  return {
    id: "purchase-1",
    user_id: "user-1",
    card_id: "card-1",
    description: "Notebook",
    purchase_date: "2025-01-10",
    first_installment_month: "2025-03-01",
    installment_count: 3,
    total_amount_cents: 10000,
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

function findBreakdown(
  purchases: ReturnType<typeof buildPurchaseWithProgress>[],
  monthlyExpenses: ReturnType<typeof buildMonthlyExpenseWithCard>[],
  month = "2025-03"
) {
  return (
    buildMonthlyBreakdowns({
      focusMonth: month,
      monthlyExpenses,
      purchases,
      referenceMonthKey: month,
    }).find((breakdown) => breakdown.month === month) ??
    emptyMonthlyBreakdown(month)
  )
}

describe("monthly export", () => {
  it("builds an empty monthly document", () => {
    const model = buildMonthlyExportModel({
      breakdown: emptyMonthlyBreakdown("2025-03"),
      monthlyExpenses: [],
      purchases: [],
    })

    expect(model).toMatchObject({
      month: "2025-03",
      total_amount_cents: 0,
      item_count: 0,
      purchases: [],
      monthly_expenses: [],
    })
    expect(buildMonthlyExportText(model)).toContain(
      "Nenhuma compra parcelada neste mês."
    )
    expect(getMonthlyExportFileName(model)).toBe("resumo-2025-03.png")
  })

  it("includes purchase installment value, purchase total, notes and cents", () => {
    const purchase = buildPurchaseWithProgress(
      createPurchase({
        notes: "Enviar comprovante junto.",
        total_amount_cents: 10000,
      }),
      "Cartão principal",
      "2025-03"
    )
    const breakdown = findBreakdown([purchase], [])
    const model = buildMonthlyExportModel({
      breakdown,
      monthlyExpenses: [],
      purchases: [purchase],
    })
    const text = buildMonthlyExportText(model)

    expect(model.purchases[0]).toMatchObject({
      description: "Notebook",
      installment_amount_cents: 3333,
      installment_index: 1,
      installment_count: 3,
      total_amount_cents: 10000,
      notes: "Enviar comprovante junto.",
    })
    expect(text).toContain(
      `Parcela 1/3: ${formatCurrencyFromCents(3333)} no mês`
    )
    expect(text).toContain(
      `Total da compra: ${formatCurrencyFromCents(10000)}`
    )
    expect(text).toContain("Obs.: Enviar comprovante junto.")
  })

  it("includes monthly expenses with open and closed periods", () => {
    const openExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        id: "monthly-open",
        description: "Academia",
        end_month: null,
      }),
      "Cartão principal"
    )
    const closedExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        id: "monthly-closed",
        amount_cents: 4990,
        description: "Streaming",
        end_month: "2025-05-01",
        notes: "Plano familiar.",
      }),
      "Cartão digital"
    )
    const breakdown = findBreakdown([], [openExpense, closedExpense])
    const model = buildMonthlyExportModel({
      breakdown,
      monthlyExpenses: [openExpense, closedExpense],
      purchases: [],
    })
    const text = buildMonthlyExportText(model)

    expect(model.monthly_expenses).toHaveLength(2)
    expect(text).toContain(
      `Academia | Cartão principal | ${formatCurrencyFromCents(12990)} | Desde`
    )
    expect(text).toContain(
      `Streaming | Cartão digital | ${formatCurrencyFromCents(
        4990
      )} | Março de 2025 até Maio de 2025`
    )
    expect(text).toContain("Obs.: Plano familiar.")
  })

  it("excludes disabled purchases and monthly expenses", () => {
    const activePurchase = buildPurchaseWithProgress(
      createPurchase({ id: "purchase-active", total_amount_cents: 9000 }),
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
    const activeMonthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({ id: "monthly-active" }),
      "Cartão principal"
    )
    const disabledMonthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        id: "monthly-disabled",
        description: "Assinatura pausada",
        is_disabled: true,
      }),
      "Cartão principal"
    )
    const breakdown = findBreakdown(
      [activePurchase, disabledPurchase],
      [activeMonthlyExpense, disabledMonthlyExpense]
    )
    const model = buildMonthlyExportModel({
      breakdown,
      monthlyExpenses: [activeMonthlyExpense, disabledMonthlyExpense],
      purchases: [activePurchase, disabledPurchase],
    })
    const text = buildMonthlyExportText(model)

    expect(model.total_amount_cents).toBe(15990)
    expect(text).toContain("Notebook")
    expect(text).toContain("Academia")
    expect(text).not.toContain("Compra incerta")
    expect(text).not.toContain("Assinatura pausada")
    expect(text).toContain("Itens desativados não entram neste resumo.")
  })

  it("keeps complete export data independent from visible filters", () => {
    const firstPurchase = buildPurchaseWithProgress(
      createPurchase({
        id: "purchase-visible",
        description: "Notebook",
        total_amount_cents: 9000,
      }),
      "Cartão principal",
      "2025-03"
    )
    const secondPurchase = buildPurchaseWithProgress(
      createPurchase({
        id: "purchase-hidden-by-filter",
        card_id: "card-2",
        description: "Cadeira",
        total_amount_cents: 12000,
      }),
      "Cartão extra",
      "2025-03"
    )
    const allPurchases = [firstPurchase, secondPurchase]
    const visiblePurchases = filterPurchases(
      allPurchases,
      parseDashboardFilters({ card: "card-1", month: "2025-03" })
    )
    const completeBreakdown = findBreakdown(allPurchases, [])
    const model = buildMonthlyExportModel({
      breakdown: completeBreakdown,
      monthlyExpenses: [],
      purchases: allPurchases,
    })

    expect(visiblePurchases.map((purchase) => purchase.description)).toEqual([
      "Notebook",
    ])
    expect(model.purchases.map((purchase) => purchase.description)).toEqual([
      "Cadeira",
      "Notebook",
    ])
    expect(model.total_amount_cents).toBe(7000)
  })
})
