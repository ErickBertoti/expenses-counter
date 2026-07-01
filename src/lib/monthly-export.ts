import {
  formatCurrencyFromCents,
  getMonthlyExpensePeriodLabel,
} from "./purchases"
import type {
  MonthlyBreakdown,
  MonthlyExpenseWithCard,
  MonthlyExportModel,
  PurchaseWithProgress,
} from "./types"

type BuildMonthlyExportModelInput = {
  breakdown: MonthlyBreakdown
  monthlyExpenses: MonthlyExpenseWithCard[]
  purchases: PurchaseWithProgress[]
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

export function getMonthlyExportFileName(model: Pick<MonthlyExportModel, "month">) {
  return `resumo-${model.month}.png`
}

export function buildMonthlyExportModel({
  breakdown,
  monthlyExpenses,
  purchases,
}: BuildMonthlyExportModelInput): MonthlyExportModel {
  const purchasesById = new Map(purchases.map((purchase) => [purchase.id, purchase]))
  const monthlyExpensesById = new Map(
    monthlyExpenses.map((monthlyExpense) => [monthlyExpense.id, monthlyExpense])
  )
  const purchaseItems = breakdown.line_items
    .filter((lineItem) => lineItem.source_type === "purchase")
    .map((lineItem) => {
      const purchase = purchasesById.get(lineItem.source_id)

      if (!purchase) {
        return null
      }

      return {
        id: lineItem.source_id,
        description: lineItem.description,
        card_name: lineItem.card_name,
        installment_index: lineItem.installment_index ?? 1,
        installment_count:
          lineItem.installment_count ?? purchase.installment_count,
        installment_amount_cents: lineItem.amount_cents,
        total_amount_cents: purchase.total_amount_cents,
        notes: purchase.notes,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const monthlyExpenseItems = breakdown.line_items
    .filter((lineItem) => lineItem.source_type === "monthly_expense")
    .map((lineItem) => {
      const monthlyExpense = monthlyExpensesById.get(lineItem.source_id)

      if (!monthlyExpense) {
        return null
      }

      return {
        id: lineItem.source_id,
        description: lineItem.description,
        card_name: lineItem.card_name,
        amount_cents: lineItem.amount_cents,
        period_label: getMonthlyExpensePeriodLabel(monthlyExpense),
        notes: monthlyExpense.notes,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const purchaseIds = new Set(purchaseItems.map((item) => item.id))

  return {
    month: breakdown.month,
    month_label: breakdown.month_label,
    total_amount_cents: breakdown.total_amount_cents,
    installment_total_cents: breakdown.installment_total_cents,
    monthly_total_cents: breakdown.monthly_total_cents,
    item_count: breakdown.item_count,
    purchase_count: purchaseIds.size,
    installment_count: breakdown.installment_count,
    monthly_expense_count: breakdown.monthly_expense_count,
    by_card: breakdown.by_card.map((card) => ({
      card_id: card.card_id,
      card_name: card.card_name,
      total_amount_cents: card.total_amount_cents,
      item_count: card.item_count,
    })),
    purchases: purchaseItems,
    monthly_expenses: monthlyExpenseItems,
  }
}

function appendNotes(lines: string[], notes: string | null) {
  if (notes) {
    lines.push(`  Obs.: ${notes}`)
  }
}

export function buildMonthlyExportText(model: MonthlyExportModel) {
  const lines = [
    `Resumo de ${model.month_label}`,
    "",
    `Total a pagar no mês: ${formatCurrencyFromCents(
      model.total_amount_cents
    )}`,
    `Parcelas: ${formatCurrencyFromCents(model.installment_total_cents)} (${
      model.installment_count
    } ${pluralize(model.installment_count, "parcela", "parcelas")})`,
    `Mensalidades: ${formatCurrencyFromCents(model.monthly_total_cents)} (${
      model.monthly_expense_count
    } ${pluralize(model.monthly_expense_count, "mensalidade", "mensalidades")})`,
    `Itens no mês: ${model.item_count}`,
    "",
    "Por cartão:",
  ]

  if (model.by_card.length === 0) {
    lines.push("- Nenhum valor neste mês.")
  } else {
    model.by_card.forEach((card) => {
      lines.push(
        `- ${card.card_name}: ${formatCurrencyFromCents(
          card.total_amount_cents
        )} (${card.item_count} ${pluralize(card.item_count, "item", "itens")})`
      )
    })
  }

  lines.push("", "Compras parceladas:")

  if (model.purchases.length === 0) {
    lines.push("- Nenhuma compra parcelada neste mês.")
  } else {
    model.purchases.forEach((purchase) => {
      lines.push(
        `- ${purchase.description} | ${purchase.card_name} | Parcela ${
          purchase.installment_index
        }/${purchase.installment_count}: ${formatCurrencyFromCents(
          purchase.installment_amount_cents
        )} no mês | Total da compra: ${formatCurrencyFromCents(
          purchase.total_amount_cents
        )}`
      )
      appendNotes(lines, purchase.notes)
    })
  }

  lines.push("", "Mensalidades:")

  if (model.monthly_expenses.length === 0) {
    lines.push("- Nenhuma mensalidade neste mês.")
  } else {
    model.monthly_expenses.forEach((monthlyExpense) => {
      lines.push(
        `- ${monthlyExpense.description} | ${
          monthlyExpense.card_name
        } | ${formatCurrencyFromCents(monthlyExpense.amount_cents)} | ${
          monthlyExpense.period_label
        }`
      )
      appendNotes(lines, monthlyExpense.notes)
    })
  }

  lines.push("", "Itens desativados não entram neste resumo.")

  return lines.join("\n")
}
