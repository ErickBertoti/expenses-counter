export type DashboardUrlUpdates = Partial<
  Record<"q" | "status" | "month" | "card" | "includeDisabled", string>
>

export type ExpenseComposerMode = {
  kind: "purchase" | "monthly"
  isEditing: boolean
  key: string
}

export function resolveExpenseComposerMode(
  search: string,
  selectedPurchaseId?: string,
  selectedMonthlyExpenseId?: string
): ExpenseComposerMode | null {
  const params = new URLSearchParams(search)
  if (selectedPurchaseId && params.get("edit")?.trim() === selectedPurchaseId) {
    return { kind: "purchase", isEditing: true, key: `purchase:${selectedPurchaseId}` }
  }
  if (selectedMonthlyExpenseId && params.get("editMonthly")?.trim() === selectedMonthlyExpenseId) {
    return { kind: "monthly", isEditing: true, key: `monthly:${selectedMonthlyExpenseId}` }
  }
  const compose = params.get("compose")
  if (compose === "1" || compose === "purchase") {
    return { kind: "purchase", isEditing: false, key: "purchase:new" }
  }
  if (compose === "monthly") {
    return { kind: "monthly", isEditing: false, key: "monthly:new" }
  }
  return null
}

export function resolveDashboardHref(
  pathname: string,
  searchParamsString: string,
  updates: DashboardUrlUpdates
) {
  const params = new URLSearchParams(searchParamsString)

  for (const [key, value] of Object.entries(updates)) {
    const shouldDelete =
      !value ||
      (key === "status" && value === "all") ||
      (key === "includeDisabled" && value !== "1")

    if (shouldDelete) params.delete(key)
    else params.set(key, value)
  }

  params.delete("edit")
  params.delete("editMonthly")
  params.delete("flash")
  params.delete("compose")

  const nextQuery = params.toString()
  return nextQuery ? `${pathname}?${nextQuery}` : pathname
}

export function resolveDashboardMonthHref(baseHref: string, month: string) {
  const baseUrl = new URL(baseHref, "https://dashboard.local")
  return resolveDashboardHref(baseUrl.pathname, baseUrl.search.slice(1), { month })
}
