import { describe, expect, it } from "vitest"

import { buildPurchaseWithProgress } from "./purchases"
import { sortPurchases, type PurchaseSortKey } from "./purchase-sorting"
import type { PurchaseRecord } from "./types"

function record(overrides: Partial<PurchaseRecord>): PurchaseRecord {
  return {
    id: "one",
    user_id: "user",
    card_id: "card",
    description: "Compra",
    purchase_date: "2026-01-01",
    first_installment_month: "2026-02-01",
    installment_count: 2,
    total_amount_cents: 2000,
    notes: null,
    is_disabled: false,
    created_at: "",
    updated_at: "",
    ...overrides,
  }
}

const purchases = [
  buildPurchaseWithProgress(record({ id: "a", description: "Alpha", total_amount_cents: 5000 }), "Cartão", "2026-02"),
  buildPurchaseWithProgress(record({ id: "b", description: "Beta", first_installment_month: "2027-01-01", installment_count: 12, total_amount_cents: 12000 }), "Cartão", "2026-02"),
]

describe("purchase sorting", () => {
  it("sorts numeric values descending", () => {
    expect(sortPurchases(purchases, "2026-02", "total", "descending").map((item) => item.id)).toEqual(["b", "a"])
    expect(sortPurchases(purchases, "2026-02", "duration", "descending").map((item) => item.id)).toEqual(["b", "a"])
  })

  it("keeps missing monthly installments last in both directions", () => {
    expect(sortPurchases(purchases, "2026-02", "installment", "ascending").map((item) => item.id)).toEqual(["a", "b"])
    expect(sortPurchases(purchases, "2026-02", "installment", "descending").map((item) => item.id)).toEqual(["a", "b"])
  })

  it("supports every column in both directions", () => {
    const cases: Array<{
      key: PurchaseSortKey
      ascending: string[]
      descending: string[]
    }> = [
      { key: "purchase", ascending: ["a", "b"], descending: ["b", "a"] },
      { key: "installment", ascending: ["a", "b"], descending: ["a", "b"] },
      { key: "total", ascending: ["a", "b"], descending: ["b", "a"] },
      { key: "remaining", ascending: ["a", "b"], descending: ["b", "a"] },
      { key: "duration", ascending: ["a", "b"], descending: ["b", "a"] },
      { key: "completion", ascending: ["a", "b"], descending: ["b", "a"] },
    ]

    for (const testCase of cases) {
      expect(
        sortPurchases(purchases, "2026-02", testCase.key, "ascending").map(
          (item) => item.id
        )
      ).toEqual(testCase.ascending)
      expect(
        sortPurchases(purchases, "2026-02", testCase.key, "descending").map(
          (item) => item.id
        )
      ).toEqual(testCase.descending)
    }
  })

  it("uses description and id to resolve ties", () => {
    const tied = [
      buildPurchaseWithProgress(
        record({ id: "z", description: "Compra", total_amount_cents: 5000 }),
        "Cartão",
        "2026-02"
      ),
      buildPurchaseWithProgress(
        record({ id: "a", description: "Compra", total_amount_cents: 5000 }),
        "Cartão",
        "2026-02"
      ),
      buildPurchaseWithProgress(
        record({ id: "b", description: "Álbum", total_amount_cents: 5000 }),
        "Cartão",
        "2026-02"
      ),
    ]

    expect(sortPurchases(tied, "2026-02", "total", "descending").map((item) => item.id)).toEqual([
      "b",
      "a",
      "z",
    ])
  })

  it("returns the original order without a key", () => {
    expect(sortPurchases(purchases, "2026-02", null, "ascending")).toBe(purchases)
  })
})
