import { getInstallmentAmountForMonth } from "./purchases"
import type { PurchaseWithProgress } from "./types"

export type PurchaseSortKey =
  | "purchase"
  | "installment"
  | "total"
  | "remaining"
  | "duration"
  | "completion"

export type SortDirection = "ascending" | "descending"

export function sortPurchases(
  purchases: PurchaseWithProgress[],
  focusMonth: string,
  key: PurchaseSortKey | null,
  direction: SortDirection
) {
  if (!key) return purchases

  return purchases.toSorted((left, right) => {
    if (key === "installment") {
      const leftValue = getInstallmentAmountForMonth(left, focusMonth)
      const rightValue = getInstallmentAmountForMonth(right, focusMonth)
      if (leftValue === null && rightValue !== null) return 1
      if (rightValue === null && leftValue !== null) return -1
      if (leftValue !== rightValue) {
        const result = (leftValue ?? 0) - (rightValue ?? 0)
        return direction === "ascending" ? result : -result
      }
    } else {
      const leftValue =
        key === "purchase"
          ? left.description
          : key === "total"
            ? left.total_amount_cents
            : key === "remaining"
              ? left.remaining_amount_cents
              : key === "duration"
                ? left.installment_count
                : left.completion_month
      const rightValue =
        key === "purchase"
          ? right.description
          : key === "total"
            ? right.total_amount_cents
            : key === "remaining"
              ? right.remaining_amount_cents
              : key === "duration"
                ? right.installment_count
                : right.completion_month
      const result =
        typeof leftValue === "string"
          ? leftValue.localeCompare(String(rightValue), "pt-BR")
          : leftValue - Number(rightValue)
      if (result !== 0) return direction === "ascending" ? result : -result
    }

    return (
      left.description.localeCompare(right.description, "pt-BR") ||
      left.id.localeCompare(right.id)
    )
  })
}
