import { describe, expect, it } from "vitest"

import {
  buildMonthlyBreakdowns,
  buildMonthlyExpenseWithCard,
  buildPurchaseWithProgress,
  emptyMonthlyBreakdown,
  filterMonthlyExpenses,
  filterPurchases,
  formatCurrencyFromCents,
  parseDashboardFilters,
  shouldIncludeDisabledInAnalytics,
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
      includesDisabled: false,
      monthlyExpenses: [],
      purchases: [],
      scopeLabel: "Escopo filtrado: desativadas excluídas.",
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
      includesDisabled: false,
      monthlyExpenses: [],
      purchases: [purchase],
      scopeLabel: "Escopo filtrado: desativadas excluídas.",
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
      includesDisabled: false,
      monthlyExpenses: [openExpense, closedExpense],
      purchases: [],
      scopeLabel: "Escopo filtrado: desativadas excluídas.",
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
      includesDisabled: false,
      monthlyExpenses: [activeMonthlyExpense],
      purchases: [activePurchase],
      scopeLabel: "Escopo filtrado: desativadas excluídas.",
    })
    const text = buildMonthlyExportText(model)

    expect(model.total_amount_cents).toBe(15990)
    expect(text).toContain("Notebook")
    expect(text).toContain("Academia")
    expect(text).not.toContain("Compra incerta")
    expect(text).not.toContain("Assinatura pausada")
    expect(text).toContain("Itens desativados não entram neste resumo.")
  })

  it("includes disabled items when the filtered scope requests them", () => {
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
      "Cartão principal",
      "2025-03"
    )
    const disabledMonthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        id: "monthly-disabled",
        description: "Assinatura pausada",
        is_disabled: true,
      }),
      "Cartão principal",
      "2025-03"
    )
    const breakdown =
      buildMonthlyBreakdowns({
        focusMonth: "2025-03",
        includeDisabled: true,
        monthlyExpenses: [activeMonthlyExpense, disabledMonthlyExpense],
        purchases: [activePurchase, disabledPurchase],
        referenceMonthKey: "2025-03",
      }).find((item) => item.month === "2025-03") ??
      emptyMonthlyBreakdown("2025-03")
    const model = buildMonthlyExportModel({
      breakdown,
      includesDisabled: true,
      monthlyExpenses: [activeMonthlyExpense, disabledMonthlyExpense],
      purchases: [activePurchase, disabledPurchase],
      scopeLabel: "Escopo filtrado: desativadas incluídas.",
    })
    const text = buildMonthlyExportText(model)

    expect(model.includes_disabled).toBe(true)
    expect(model.total_amount_cents).toBe(58980)
    expect(text).toContain("Compra incerta")
    expect(text).toContain("Assinatura pausada")
    expect(text).toContain("Itens desativados foram incluídos conforme os filtros.")
  })

  it("applies search, status, card and month filters before exporting", () => {
    const matchingPurchase = buildPurchaseWithProgress(
      createPurchase({
        id: "purchase-match",
        card_id: "card-2",
        description: "Curso de fotografia",
        first_installment_month: "2025-04-01",
        installment_count: 1,
        total_amount_cents: 5000,
      }),
      "Cartão extra",
      "2025-05"
    )
    const otherPurchase = buildPurchaseWithProgress(
      createPurchase({
        id: "purchase-other",
        description: "Curso de idiomas",
        first_installment_month: "2025-04-01",
        installment_count: 1,
        total_amount_cents: 7000,
      }),
      "Cartão principal",
      "2025-05"
    )
    const matchingMonthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        id: "monthly-match",
        card_id: "card-2",
        description: "Curso recorrente",
        amount_cents: 1200,
        start_month: "2025-04-01",
        end_month: "2025-04-01",
      }),
      "Cartão extra",
      "2025-05"
    )
    const otherMonthlyExpense = buildMonthlyExpenseWithCard(
      createMonthlyExpense({
        id: "monthly-other",
        card_id: "card-2",
        description: "Curso vigente",
        amount_cents: 900,
        start_month: "2025-04-01",
        end_month: null,
      }),
      "Cartão extra",
      "2025-05"
    )
    const filters = parseDashboardFilters({
      card: "card-2",
      month: "2025-04",
      q: "curso",
      status: "completed",
    })
    const visiblePurchases = filterPurchases(
      [matchingPurchase, otherPurchase],
      filters
    )
    const visibleMonthlyExpenses = filterMonthlyExpenses(
      [matchingMonthlyExpense, otherMonthlyExpense],
      filters
    )
    const breakdown =
      buildMonthlyBreakdowns({
        focusMonth: "2025-04",
        includeDisabled: shouldIncludeDisabledInAnalytics(filters),
        monthlyExpenses: visibleMonthlyExpenses,
        purchases: visiblePurchases,
        range: {
          startMonth: "2025-04",
          endMonth: "2025-04",
        },
        referenceMonthKey: "2025-05",
      }).find((item) => item.month === "2025-04") ??
      emptyMonthlyBreakdown("2025-04")
    const model = buildMonthlyExportModel({
      breakdown,
      includesDisabled: false,
      monthlyExpenses: visibleMonthlyExpenses,
      purchases: visiblePurchases,
      scopeLabel: "Escopo filtrado: busca \"curso\"; status Concluídas; cartão Cartão extra.",
    })

    expect(visiblePurchases.map((purchase) => purchase.id)).toEqual([
      "purchase-match",
    ])
    expect(visibleMonthlyExpenses.map((expense) => expense.id)).toEqual([
      "monthly-match",
    ])
    expect(model.item_count).toBe(2)
    expect(model.total_amount_cents).toBe(6200)
    expect(model.purchases.map((purchase) => purchase.description)).toEqual([
      "Curso de fotografia",
    ])
    expect(model.monthly_expenses.map((expense) => expense.description)).toEqual([
      "Curso recorrente",
    ])
  })

  it("builds the export from the filtered portfolio", () => {
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
    const filteredBreakdown = findBreakdown(visiblePurchases, [])
    const model = buildMonthlyExportModel({
      breakdown: filteredBreakdown,
      includesDisabled: false,
      monthlyExpenses: [],
      purchases: visiblePurchases,
      scopeLabel: "Escopo filtrado: cartão Cartão principal.",
    })

    expect(visiblePurchases.map((purchase) => purchase.description)).toEqual([
      "Notebook",
    ])
    expect(model.purchases.map((purchase) => purchase.description)).toEqual(["Notebook"])
    expect(model.total_amount_cents).toBe(3000)
    expect(buildMonthlyExportText(model)).toContain(
      "Escopo filtrado: cartão Cartão principal."
    )
  })
})
