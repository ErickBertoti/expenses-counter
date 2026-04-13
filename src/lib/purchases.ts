import type {
  DashboardFilters,
  DashboardView,
  MonthlySummary,
  PurchaseRecord,
  PurchaseWithProgress,
} from "@/lib/types"

const MONTH_PATTERN = /^\d{4}-\d{2}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DASHBOARD_VIEWS = new Set<DashboardView>(["purchases", "summary"])

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
})

function padMonth(value: number) {
  return String(value).padStart(2, "0")
}

function assertMonthKey(monthKey: string) {
  if (!MONTH_PATTERN.test(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }

  const [year, month] = monthKey.split("-").map(Number)
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }

  return { year, month }
}

function assertDateValue(dateValue: string) {
  if (!DATE_PATTERN.test(dateValue)) {
    throw new Error(`Invalid date value: ${dateValue}`)
  }

  return dateValue
}

function firstSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
}

function capitalizeLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isDashboardView(value: string): value is DashboardView {
  return DASHBOARD_VIEWS.has(value as DashboardView)
}

export function isValidMonthKey(value: string) {
  try {
    assertMonthKey(value)
    return true
  } catch {
    return false
  }
}

export function getCurrentMonthKey(referenceDate = new Date()) {
  return `${referenceDate.getFullYear()}-${padMonth(referenceDate.getMonth() + 1)}`
}

export function monthKeyFromDate(dateValue: string) {
  return assertDateValue(dateValue).slice(0, 7)
}

export function addMonthsToMonthKey(monthKey: string, delta: number) {
  const { year, month } = assertMonthKey(monthKey)
  const nextMonthIndex = year * 12 + (month - 1) + delta
  const nextYear = Math.floor(nextMonthIndex / 12)
  const nextMonth = (nextMonthIndex % 12) + 1

  return `${nextYear}-${padMonth(nextMonth)}`
}

export function compareMonthKeys(left: string, right: string) {
  const leftParts = assertMonthKey(left)
  const rightParts = assertMonthKey(right)

  if (leftParts.year !== rightParts.year) {
    return leftParts.year - rightParts.year
  }

  return leftParts.month - rightParts.month
}

export function monthsBetween(startMonthKey: string, endMonthKey: string) {
  const start = assertMonthKey(startMonthKey)
  const end = assertMonthKey(endMonthKey)

  return (end.year - start.year) * 12 + (end.month - start.month)
}

export function splitInstallments(totalAmountCents: number, installmentCount: number) {
  const baseInstallment = Math.floor(totalAmountCents / installmentCount)
  const regularInstallmentsTotal = baseInstallment * (installmentCount - 1)
  const lastInstallment = totalAmountCents - regularInstallmentsTotal

  return Array.from({ length: installmentCount }, (_, index) =>
    index === installmentCount - 1 ? lastInstallment : baseInstallment
  )
}

export function getCompletionMonth(firstInstallmentMonth: string, installmentCount: number) {
  return addMonthsToMonthKey(firstInstallmentMonth, installmentCount - 1)
}

export function hasInstallmentInMonth(
  purchase: Pick<PurchaseRecord, "first_installment_month" | "installment_count">,
  monthKey: string
) {
  const offset = monthsBetween(purchase.first_installment_month.slice(0, 7), monthKey)
  return offset >= 0 && offset < purchase.installment_count
}

export function getInstallmentAmountForMonth(
  purchase: Pick<
    PurchaseRecord,
    "first_installment_month" | "installment_count" | "total_amount_cents"
  >,
  monthKey: string
) {
  if (!hasInstallmentInMonth(purchase, monthKey)) {
    return null
  }

  const monthOffset = monthsBetween(purchase.first_installment_month.slice(0, 7), monthKey)
  return (
    splitInstallments(purchase.total_amount_cents, purchase.installment_count)[monthOffset] ??
    null
  )
}

export function buildPurchaseWithProgress(
  purchase: PurchaseRecord,
  cardName: string,
  referenceMonthKey = getCurrentMonthKey()
): PurchaseWithProgress {
  const firstInstallmentMonth = purchase.first_installment_month.slice(0, 7)
  const installmentAmounts = splitInstallments(
    purchase.total_amount_cents,
    purchase.installment_count
  )
  const paidInstallments = clamp(
    monthsBetween(firstInstallmentMonth, referenceMonthKey),
    0,
    purchase.installment_count
  )
  const paidAmountCents = installmentAmounts
    .slice(0, paidInstallments)
    .reduce((total, amount) => total + amount, 0)
  const remainingAmountCents = purchase.total_amount_cents - paidAmountCents
  const remainingInstallments = purchase.installment_count - paidInstallments

  return {
    ...purchase,
    card_name: cardName,
    installment_amounts_cents: installmentAmounts,
    paid_installments: paidInstallments,
    remaining_installments: remainingInstallments,
    paid_amount_cents: paidAmountCents,
    remaining_amount_cents: remainingAmountCents,
    completion_month: getCompletionMonth(firstInstallmentMonth, purchase.installment_count),
    status: remainingInstallments === 0 ? "completed" : "active",
  }
}

export function filterPurchases(
  purchases: PurchaseWithProgress[],
  filters: DashboardFilters
) {
  const normalizedQuery = filters.query.toLocaleLowerCase("pt-BR")

  return purchases.filter((purchase) => {
    if (
      normalizedQuery &&
      !purchase.description.toLocaleLowerCase("pt-BR").includes(normalizedQuery)
    ) {
      return false
    }

    if (filters.status !== "all" && purchase.status !== filters.status) {
      return false
    }

    if (filters.cardId && purchase.card_id !== filters.cardId) {
      return false
    }

    if (filters.month && !hasInstallmentInMonth(purchase, filters.month)) {
      return false
    }

    return true
  })
}

export function sortPurchasesForDashboard(purchases: PurchaseWithProgress[]) {
  return purchases.toSorted((left, right) => {
    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1
    }

    const byCompletionMonth = compareMonthKeys(left.completion_month, right.completion_month)
    if (byCompletionMonth !== 0) {
      return byCompletionMonth
    }

    return right.purchase_date.localeCompare(left.purchase_date)
  })
}

export function buildMonthlySummaries(purchases: PurchaseWithProgress[]) {
  const monthlyTotals = new Map<
    string,
    { total_amount_cents: number; installment_count: number; purchase_ids: Set<string> }
  >()

  for (const purchase of purchases) {
    const firstInstallmentMonth = purchase.first_installment_month.slice(0, 7)
    purchase.installment_amounts_cents.forEach((amount, index) => {
      const month = addMonthsToMonthKey(firstInstallmentMonth, index)
      const entry = monthlyTotals.get(month) ?? {
        total_amount_cents: 0,
        installment_count: 0,
        purchase_ids: new Set<string>(),
      }

      entry.total_amount_cents += amount
      entry.installment_count += 1
      entry.purchase_ids.add(purchase.id)

      monthlyTotals.set(month, entry)
    })
  }

  return Array.from(monthlyTotals.entries())
    .map(([month, entry]): MonthlySummary => {
      return {
        month,
        month_label: formatMonthLabel(month),
        total_amount_cents: entry.total_amount_cents,
        purchase_count: entry.purchase_ids.size,
        installment_count: entry.installment_count,
      }
    })
    .toSorted((left, right) => compareMonthKeys(right.month, left.month))
}

export function emptyMonthlySummary(month: string): MonthlySummary {
  return {
    month,
    month_label: formatMonthLabel(month),
    total_amount_cents: 0,
    purchase_count: 0,
    installment_count: 0,
  }
}

export function formatCurrencyFromCents(value: number) {
  return currencyFormatter.format(value / 100)
}

export function formatMonthLabel(monthKey: string) {
  const { year, month } = assertMonthKey(monthKey)
  return capitalizeLabel(monthFormatter.format(new Date(Date.UTC(year, month - 1, 1))))
}

export function formatDateLabel(dateValue: string) {
  assertDateValue(dateValue)
  return dateFormatter.format(new Date(`${dateValue}T12:00:00Z`))
}

export function formatCentsForInput(value: number) {
  return (value / 100).toFixed(2).replace(".", ",")
}

export function parseCurrencyInputToCents(rawValue: string) {
  const sanitized = rawValue.replace(/[^\d,.-]/g, "").trim()
  if (!sanitized) {
    return null
  }

  const lastCommaIndex = sanitized.lastIndexOf(",")
  const lastDotIndex = sanitized.lastIndexOf(".")
  const decimalSeparatorIndex = Math.max(lastCommaIndex, lastDotIndex)

  let normalized = sanitized
  if (decimalSeparatorIndex >= 0) {
    const integerPart = sanitized.slice(0, decimalSeparatorIndex).replace(/[.,]/g, "")
    const decimalPart = sanitized.slice(decimalSeparatorIndex + 1).replace(/[.,]/g, "")

    normalized = `${integerPart}.${decimalPart}`
  }

  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    return null
  }

  const parsedValue = Number(normalized)
  if (!Number.isFinite(parsedValue)) {
    return null
  }

  return Math.round(parsedValue * 100)
}

export function parseDashboardFilters(
  searchParams: Record<string, string | string[] | undefined>
): DashboardFilters {
  const query = firstSearchParamValue(searchParams.q).trim().slice(0, 80)
  const rawStatus = firstSearchParamValue(searchParams.status)
  const month = firstSearchParamValue(searchParams.month)
  const flash = firstSearchParamValue(searchParams.flash).trim()
  const rawView = firstSearchParamValue(searchParams.view)

  return {
    query,
    status:
      rawStatus === "active" || rawStatus === "completed" ? rawStatus : "all",
    month: isValidMonthKey(month) ? month : "",
    cardId: firstSearchParamValue(searchParams.card).trim(),
    view: isDashboardView(rawView) ? rawView : "purchases",
    editId: firstSearchParamValue(searchParams.edit).trim(),
    flash,
  }
}

export function buildReturnToPath(
  filters: Pick<DashboardFilters, "query" | "status" | "month" | "cardId" | "view">,
  extras?: Record<string, string | undefined>
) {
  const params = new URLSearchParams()

  if (filters.query) {
    params.set("q", filters.query)
  }

  if (filters.status !== "all") {
    params.set("status", filters.status)
  }

  if (filters.month) {
    params.set("month", filters.month)
  }

  if (filters.cardId) {
    params.set("card", filters.cardId)
  }

  if (filters.view !== "purchases") {
    params.set("view", filters.view)
  }

  for (const [key, value] of Object.entries(extras ?? {})) {
    if (value) {
      params.set(key, value)
    }
  }

  const query = params.toString()
  return query ? `/?${query}` : "/"
}

export function sanitizeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/"
  }

  return value
}
