export type DashboardUrlUpdates = Partial<
  Record<"q" | "status" | "month" | "card" | "includeDisabled", string>
>

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
