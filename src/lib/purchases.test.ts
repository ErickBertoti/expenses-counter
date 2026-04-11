import { describe, expect, it } from "vitest"

import {
  buildMonthlySummaries,
  buildPurchaseWithProgress,
  getInstallmentAmountForMonth,
} from "./purchases"
import type { PurchaseRecord } from "./types"

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
        total_amount_cents: 20000,
        purchase_count: 2,
        installment_count: 2,
      },
      {
        month: "2025-03",
        month_label: "Março de 2025",
        total_amount_cents: 20000,
        purchase_count: 2,
        installment_count: 2,
      },
      {
        month: "2025-02",
        month_label: "Fevereiro de 2025",
        total_amount_cents: 10000,
        purchase_count: 1,
        installment_count: 1,
      },
    ])
  })
})
