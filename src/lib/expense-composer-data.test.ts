import { describe, expect, it } from "vitest"

import { buildExpenseComposerData, resolveExpenseComposer } from "./expense-composer-data"
import type { MonthlyExpenseRecord, PurchaseRecord } from "./types"

const purchase: PurchaseRecord = {
  id: "p1", user_id: "user", card_id: "card-2", description: "Notebook",
  purchase_date: "2026-09-13", first_installment_month: "2026-10-01",
  installment_count: 5, total_amount_cents: 123456, notes: "Garantia",
  is_disabled: false, created_at: "", updated_at: "",
}
const monthly: MonthlyExpenseRecord = {
  id: "m1", user_id: "user", card_id: "card-2", description: "Academia",
  start_month: "2026-08-01", end_month: "2027-02-01", amount_cents: 12990,
  notes: null, is_disabled: true, created_at: "", updated_at: "",
}
const data = buildExpenseComposerData({
  purchases: [purchase], monthlyExpenses: [monthly], cardId: "default",
  month: "2026-11", today: "2026-10-24", returnTo: "/?month=2026-11&view=monthly",
})

describe("expense composer snapshots", () => {
  it("opens either edit from loaded data without a server-selected ID", () => {
    expect(resolveExpenseComposer("edit=p1", data)).toMatchObject({
      mode: { kind: "purchase", isEditing: true },
      formValues: { purchaseId: "p1", description: "Notebook", purchaseDate: "2026-09-13", firstInstallmentMonth: "2026-10", installmentCount: 5, totalAmount: "1234,56", cardId: "card-2", notes: "Garantia" },
    })
    expect(resolveExpenseComposer("editMonthly=m1", data)).toMatchObject({
      mode: { kind: "monthly", isEditing: true },
      monthlyExpenseFormValues: { monthlyExpenseId: "m1", amount: "129,90", startMonth: "2026-08", endMonth: "2027-02", notes: "" },
    })
  })

  it("uses fresh defaults after visiting either edit, preserving month and return URL", () => {
    resolveExpenseComposer("edit=p1", data)
    resolveExpenseComposer("editMonthly=m1", data)
    const create = resolveExpenseComposer("compose=purchase", data)!
    expect(create.formValues).toEqual({
      description: "", purchaseDate: "2026-10-24", firstInstallmentMonth: "2026-11",
      installmentCount: 1, totalAmount: "", cardId: "default", notes: "",
      redirectTo: "/?month=2026-11&view=monthly",
    })
    expect(resolveExpenseComposer("compose=monthly", data)?.monthlyExpenseFormValues)
      .toEqual(data.monthlyDefaults)
  })

  it("keeps valid-edit priority and rejects unknown or inherited object keys", () => {
    expect(resolveExpenseComposer("edit=%20p1%20&editMonthly=m1&compose=monthly", data)?.mode.key).toBe("purchase:p1")
    expect(resolveExpenseComposer("edit=missing&editMonthly=m1&compose=purchase", data)?.mode.key).toBe("monthly:m1")
    expect(resolveExpenseComposer("edit=missing&compose=monthly", data)?.mode.key).toBe("monthly:new")
    expect(resolveExpenseComposer("edit=missing", data)).toBeNull()
    expect(resolveExpenseComposer("edit=__proto__&editMonthly=constructor", data)).toBeNull()
  })

  it("sends only editable fields in the snapshots", () => {
    expect(data.purchases.p1).not.toHaveProperty("user_id")
    expect(data.purchases.p1).not.toHaveProperty("created_at")
    expect(data.monthlyExpenses.m1).not.toHaveProperty("is_disabled")
  })
})
