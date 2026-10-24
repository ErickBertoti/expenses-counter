import { resolveExpenseComposerMode } from "@/lib/dashboard-url"
import { formatCentsForInput } from "@/lib/purchases"
import type { MonthlyExpenseFormValues, MonthlyExpenseRecord, PurchaseFormValues, PurchaseRecord } from "@/lib/types"

// Prepare edit snapshots once with the dashboard, including records outside the
// active filters so direct links and Back/Forward use the same form values.
export function buildExpenseComposerData({
  purchases, monthlyExpenses, cardId, month, today, returnTo,
}: {
  purchases: PurchaseRecord[]
  monthlyExpenses: MonthlyExpenseRecord[]
  cardId: string
  month: string
  today: string
  returnTo: string
}) {
  const purchaseDefaults: PurchaseFormValues = {
    description: "", purchaseDate: today, firstInstallmentMonth: month,
    installmentCount: 1, totalAmount: "", cardId, notes: "", redirectTo: returnTo,
  }
  const monthlyDefaults: MonthlyExpenseFormValues = {
    description: "", amount: "", cardId, startMonth: month,
    endMonth: "", notes: "", redirectTo: returnTo,
  }
  return {
    purchaseDefaults,
    monthlyDefaults,
    purchases: Object.fromEntries(purchases.map((purchase) => [purchase.id, {
      purchaseId: purchase.id,
      description: purchase.description,
      purchaseDate: purchase.purchase_date,
      firstInstallmentMonth: purchase.first_installment_month.slice(0, 7),
      installmentCount: purchase.installment_count,
      totalAmount: formatCentsForInput(purchase.total_amount_cents),
      cardId: purchase.card_id,
      notes: purchase.notes ?? "",
      redirectTo: returnTo,
    } satisfies PurchaseFormValues])),
    monthlyExpenses: Object.fromEntries(monthlyExpenses.map((expense) => [expense.id, {
      monthlyExpenseId: expense.id,
      description: expense.description,
      amount: formatCentsForInput(expense.amount_cents),
      cardId: expense.card_id,
      startMonth: expense.start_month.slice(0, 7),
      endMonth: expense.end_month?.slice(0, 7) ?? "",
      notes: expense.notes ?? "",
      redirectTo: returnTo,
    } satisfies MonthlyExpenseFormValues])),
  }
}

export type ExpenseComposerData = ReturnType<typeof buildExpenseComposerData>

export function resolveExpenseComposer(search: string, data: ExpenseComposerData) {
  const params = new URLSearchParams(search)
  const purchaseId = params.get("edit")?.trim() ?? ""
  const monthlyId = params.get("editMonthly")?.trim() ?? ""
  const purchase = Object.hasOwn(data.purchases, purchaseId) ? data.purchases[purchaseId] : undefined
  const monthly = Object.hasOwn(data.monthlyExpenses, monthlyId) ? data.monthlyExpenses[monthlyId] : undefined
  const mode = resolveExpenseComposerMode(search, purchase?.purchaseId, monthly?.monthlyExpenseId)
  if (!mode) return null
  return {
    mode,
    formValues: mode.kind === "purchase" && mode.isEditing && purchase ? purchase : data.purchaseDefaults,
    monthlyExpenseFormValues: mode.kind === "monthly" && mode.isEditing && monthly ? monthly : data.monthlyDefaults,
  }
}
