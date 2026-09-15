import type {
  DashboardFilters,
  DashboardView,
  MonthlyBreakdown,
  MonthlyExpenseRecord,
  MonthlyExpenseWithCard,
  MonthlyLineItem,
  MonthlySummary,
  PurchaseRecord,
  PurchaseWithProgress,
} from "@/lib/types"

const PERSISTED_MONTH_PATTERN = /^\d{4}-\d{2}$/
const CALCULATED_MONTH_PATTERN = /^\d{4,6}-\d{2}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const APP_TIME_ZONE = "America/Sao_Paulo"
const MIN_CALCULATED_MONTH_YEAR = 1
const MAX_CALCULATED_MONTH_YEAR = 999999
const MAX_AMOUNT_CENTS = 2_147_483_647
const MAX_INSTALLMENT_COUNT = 120
const DASHBOARD_VIEWS = new Set<DashboardView>([
  "purchases",
  "summary",
  "monthly",
])

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

const appDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
})

function padMonth(value: number) {
  return String(value).padStart(2, "0")
}

function assertCalculatedMonthKey(monthKey: string) {
  if (!CALCULATED_MONTH_PATTERN.test(monthKey)) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }

  const [year, month] = monthKey.split("-").map(Number)
  if (
    !Number.isInteger(year) ||
    year < MIN_CALCULATED_MONTH_YEAR ||
    year > MAX_CALCULATED_MONTH_YEAR ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }

  return { year, month }
}

function assertPersistedMonthKey(monthKey: string) {
  if (!PERSISTED_MONTH_PATTERN.test(monthKey)) {
    throw new Error(`Invalid persisted month key: ${monthKey}`)
  }

  return assertCalculatedMonthKey(monthKey)
}

function assertDateValue(dateValue: string) {
  if (!DATE_PATTERN.test(dateValue)) {
    throw new Error(`Invalid date value: ${dateValue}`)
  }

  if (Number(dateValue.slice(0, 4)) < MIN_CALCULATED_MONTH_YEAR) {
    throw new Error(`Invalid date value: ${dateValue}`)
  }

  const parsedDate = new Date(`${dateValue}T00:00:00Z`)
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== dateValue
  ) {
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

function normalizeMonthValue(value: string) {
  return value.slice(0, 7)
}

export function isValidMonthKey(value: string) {
  try {
    assertPersistedMonthKey(value)
    return true
  } catch {
    return false
  }
}

export function isValidDateValue(value: string) {
  try {
    assertDateValue(value)
    return true
  } catch {
    return false
  }
}

export function isValidInstallmentSchedule(
  firstInstallmentMonth: string,
  installmentCount: number
) {
  if (
    !isValidMonthKey(firstInstallmentMonth) ||
    !Number.isInteger(installmentCount) ||
    installmentCount < 1 ||
    installmentCount > MAX_INSTALLMENT_COUNT
  ) {
    return false
  }

  return isValidMonthKey(
    addMonthsToMonthKey(firstInstallmentMonth, installmentCount - 1)
  )
}

export function getCurrentMonthKey(referenceDate = new Date()) {
  return getCurrentDateValue(referenceDate).slice(0, 7)
}

export function getCurrentDateValue(referenceDate = new Date()) {
  const parts = appDateFormatter.formatToParts(referenceDate)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error("Unable to determine the current application date")
  }

  return `${year.padStart(4, "0")}-${month}-${day}`
}

export function monthKeyFromDate(dateValue: string) {
  return assertDateValue(dateValue).slice(0, 7)
}

export function addMonthsToMonthKey(monthKey: string, delta: number) {
  const { year, month } = assertCalculatedMonthKey(monthKey)
  if (!Number.isSafeInteger(delta)) {
    throw new Error(`Invalid month delta: ${delta}`)
  }

  const nextMonthIndex = year * 12 + (month - 1) + delta
  const nextYear = Math.floor(nextMonthIndex / 12)
  const nextMonth = (nextMonthIndex % 12) + 1

  if (nextYear < 0 || nextYear > MAX_CALCULATED_MONTH_YEAR) {
    throw new Error(`Month key is outside the supported range: ${monthKey}`)
  }

  return `${String(nextYear).padStart(4, "0")}-${padMonth(nextMonth)}`
}

export function compareMonthKeys(left: string, right: string) {
  const leftParts = assertCalculatedMonthKey(left)
  const rightParts = assertCalculatedMonthKey(right)

  if (leftParts.year !== rightParts.year) {
    return leftParts.year - rightParts.year
  }

  return leftParts.month - rightParts.month
}

export function monthsBetween(startMonthKey: string, endMonthKey: string) {
  const start = assertCalculatedMonthKey(startMonthKey)
  const end = assertCalculatedMonthKey(endMonthKey)

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
  const offset = monthsBetween(normalizeMonthValue(purchase.first_installment_month), monthKey)
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

  const monthOffset = monthsBetween(
    normalizeMonthValue(purchase.first_installment_month),
    monthKey
  )
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
  const firstInstallmentMonth = normalizeMonthValue(purchase.first_installment_month)
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
    status: purchase.is_disabled
      ? "disabled"
      : remainingInstallments === 0
        ? "completed"
        : "active",
  }
}

export function buildMonthlyExpenseWithCard(
  monthlyExpense: MonthlyExpenseRecord,
  cardName: string
): MonthlyExpenseWithCard {
  return {
    ...monthlyExpense,
    card_name: cardName,
  }
}

export function hasMonthlyExpenseInMonth(
  monthlyExpense: Pick<MonthlyExpenseRecord, "start_month" | "end_month">,
  monthKey: string
) {
  const startMonth = normalizeMonthValue(monthlyExpense.start_month)
  const endMonth = monthlyExpense.end_month
    ? normalizeMonthValue(monthlyExpense.end_month)
    : null

  return (
    compareMonthKeys(monthKey, startMonth) >= 0 &&
    (!endMonth || compareMonthKeys(monthKey, endMonth) <= 0)
  )
}

export function filterPurchases(
  purchases: PurchaseWithProgress[],
  filters: DashboardFilters
) {
  const normalizedQuery = filters.query.toLocaleLowerCase("pt-BR")

  return purchases.filter((purchase) => {
    if (filters.status !== "all" && purchase.status !== filters.status) {
      return false
    }

    if (
      purchase.status === "disabled" &&
      !filters.includeDisabled &&
      filters.status !== "disabled"
    ) {
      return false
    }

    if (
      normalizedQuery &&
      !purchase.description.toLocaleLowerCase("pt-BR").includes(normalizedQuery)
    ) {
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

export function shouldIncludeDisabledInAnalytics(
  filters: Pick<DashboardFilters, "includeDisabled" | "status">
) {
  return filters.includeDisabled || filters.status === "disabled"
}

export function filterMonthlyExpenses(
  monthlyExpenses: MonthlyExpenseWithCard[],
  filters: DashboardFilters
) {
  const normalizedQuery = filters.query.toLocaleLowerCase("pt-BR")

  return monthlyExpenses.filter((monthlyExpense) => {
    if (filters.status === "disabled") {
      if (!monthlyExpense.is_disabled) {
        return false
      }
    } else if (monthlyExpense.is_disabled && !filters.includeDisabled) {
      return false
    }

    if (
      normalizedQuery &&
      !monthlyExpense.description.toLocaleLowerCase("pt-BR").includes(normalizedQuery)
    ) {
      return false
    }

    if (filters.cardId && monthlyExpense.card_id !== filters.cardId) {
      return false
    }

    if (filters.month && !hasMonthlyExpenseInMonth(monthlyExpense, filters.month)) {
      return false
    }

    return true
  })
}

export function sortPurchasesForDashboard(purchases: PurchaseWithProgress[]) {
  return purchases.toSorted((left, right) => {
    if (left.status !== right.status) {
      if (left.status === "disabled") {
        return 1
      }

      if (right.status === "disabled") {
        return -1
      }

      return left.status === "active" ? -1 : 1
    }

    const byCompletionMonth = compareMonthKeys(left.completion_month, right.completion_month)
    if (byCompletionMonth !== 0) {
      return byCompletionMonth
    }

    return right.purchase_date.localeCompare(left.purchase_date)
  })
}

export function sortMonthlyExpensesForDashboard(
  monthlyExpenses: MonthlyExpenseWithCard[]
) {
  return monthlyExpenses.toSorted((left, right) => {
    if (left.is_disabled !== right.is_disabled) {
      return left.is_disabled ? 1 : -1
    }

    const byStartMonth = compareMonthKeys(
      normalizeMonthValue(left.start_month),
      normalizeMonthValue(right.start_month)
    )

    if (byStartMonth !== 0) {
      return byStartMonth
    }

    return right.amount_cents - left.amount_cents
  })
}

function createEmptyBreakdown(month: string): MonthlyBreakdown {
  return {
    month,
    month_label: formatMonthLabel(month),
    total_amount_cents: 0,
    installment_total_cents: 0,
    monthly_total_cents: 0,
    item_count: 0,
    installment_count: 0,
    monthly_expense_count: 0,
    by_card: [],
    top_items: [],
    line_items: [],
  }
}

function pushLineItem(
  monthlyBreakdowns: Map<string, MonthlyBreakdown>,
  lineItem: MonthlyLineItem
) {
  const entry = monthlyBreakdowns.get(lineItem.month) ?? createEmptyBreakdown(lineItem.month)

  entry.line_items.push(lineItem)
  entry.total_amount_cents += lineItem.amount_cents
  entry.item_count += 1

  if (lineItem.source_type === "purchase") {
    entry.installment_total_cents += lineItem.amount_cents
    entry.installment_count += 1
  } else {
    entry.monthly_total_cents += lineItem.amount_cents
    entry.monthly_expense_count += 1
  }

  monthlyBreakdowns.set(lineItem.month, entry)
}

function finalizeMonthlyBreakdown(entry: MonthlyBreakdown): MonthlyBreakdown {
  const byCard = new Map<
    string,
    { card_id: string; card_name: string; total_amount_cents: number; item_count: number }
  >()

  for (const lineItem of entry.line_items) {
    const cardEntry = byCard.get(lineItem.card_id) ?? {
      card_id: lineItem.card_id,
      card_name: lineItem.card_name,
      total_amount_cents: 0,
      item_count: 0,
    }

    cardEntry.total_amount_cents += lineItem.amount_cents
    cardEntry.item_count += 1
    byCard.set(lineItem.card_id, cardEntry)
  }

  const sortedLineItems = entry.line_items.toSorted((left, right) => {
    if (right.amount_cents !== left.amount_cents) {
      return right.amount_cents - left.amount_cents
    }

    return (
      left.description.localeCompare(right.description, "pt-BR") ||
      left.id.localeCompare(right.id)
    )
  })

  return {
    ...entry,
    by_card: Array.from(byCard.values()).toSorted(
      (left, right) => right.total_amount_cents - left.total_amount_cents
    ),
    line_items: sortedLineItems,
    top_items: sortedLineItems.slice(0, 5),
  }
}

function getMonthlySummaryWindowEnd({
  focusMonth,
  purchases,
  referenceMonthKey,
}: {
  focusMonth?: string
  purchases: PurchaseWithProgress[]
  referenceMonthKey: string
}) {
  let windowEnd = addMonthsToMonthKey(referenceMonthKey, 12)

  if (focusMonth && compareMonthKeys(focusMonth, windowEnd) > 0) {
    windowEnd = focusMonth
  }

  for (const purchase of purchases) {
    if (compareMonthKeys(purchase.completion_month, windowEnd) > 0) {
      windowEnd = purchase.completion_month
    }
  }

  return windowEnd
}

export function buildMonthlyBreakdowns({
  focusMonth,
  includeDisabled = false,
  monthlyExpenses,
  purchases,
  referenceMonthKey = getCurrentMonthKey(),
}: {
  focusMonth?: string
  includeDisabled?: boolean
  monthlyExpenses: MonthlyExpenseWithCard[]
  purchases: PurchaseWithProgress[]
  referenceMonthKey?: string
}) {
  const includedPurchases = includeDisabled
    ? purchases
    : purchases.filter((purchase) => purchase.status !== "disabled")
  const includedMonthlyExpenses = includeDisabled
    ? monthlyExpenses
    : monthlyExpenses.filter((monthlyExpense) => !monthlyExpense.is_disabled)
  const monthlyBreakdowns = new Map<string, MonthlyBreakdown>()

  for (const purchase of includedPurchases) {
    const firstInstallmentMonth = normalizeMonthValue(purchase.first_installment_month)
    purchase.installment_amounts_cents.forEach((amount, index) => {
      const month = addMonthsToMonthKey(firstInstallmentMonth, index)
      pushLineItem(monthlyBreakdowns, {
        id: `${purchase.id}:${month}`,
        source_id: purchase.id,
        source_type: "purchase",
        month,
        description: purchase.description,
        card_id: purchase.card_id,
        card_name: purchase.card_name,
        amount_cents: amount,
        installment_index: index + 1,
        installment_count: purchase.installment_count,
      })
    })
  }

  const windowEnd = getMonthlySummaryWindowEnd({
    focusMonth,
    purchases: includedPurchases,
    referenceMonthKey,
  })

  for (const monthlyExpense of includedMonthlyExpenses) {
    let month = normalizeMonthValue(monthlyExpense.start_month)
    const endMonth = monthlyExpense.end_month
      ? normalizeMonthValue(monthlyExpense.end_month)
      : windowEnd

    while (compareMonthKeys(month, endMonth) <= 0) {
      pushLineItem(monthlyBreakdowns, {
        id: `${monthlyExpense.id}:${month}`,
        source_id: monthlyExpense.id,
        source_type: "monthly_expense",
        month,
        description: monthlyExpense.description,
        card_id: monthlyExpense.card_id,
        card_name: monthlyExpense.card_name,
        amount_cents: monthlyExpense.amount_cents,
      })

      month = addMonthsToMonthKey(month, 1)
    }
  }

  return Array.from(monthlyBreakdowns.values())
    .map(finalizeMonthlyBreakdown)
    .toSorted((left, right) => compareMonthKeys(right.month, left.month))
}

export function buildMonthlySummaries(
  purchases: PurchaseWithProgress[],
  monthlyExpenses: MonthlyExpenseWithCard[] = [],
  options?: {
    focusMonth?: string
    includeDisabled?: boolean
    referenceMonthKey?: string
  }
) {
  return buildMonthlyBreakdowns({
    purchases,
    monthlyExpenses,
    focusMonth: options?.focusMonth,
    includeDisabled: options?.includeDisabled,
    referenceMonthKey: options?.referenceMonthKey,
  }).map((breakdown): MonthlySummary => {
    const purchaseIds = new Set(
      breakdown.line_items
        .filter((lineItem) => lineItem.source_type === "purchase")
        .map((lineItem) => lineItem.source_id)
    )

    return {
      month: breakdown.month,
      month_label: breakdown.month_label,
      installment_total_cents: breakdown.installment_total_cents,
      monthly_total_cents: breakdown.monthly_total_cents,
      total_amount_cents: breakdown.total_amount_cents,
      item_count: breakdown.item_count,
      purchase_count: purchaseIds.size,
      installment_count: breakdown.installment_count,
      monthly_expense_count: breakdown.monthly_expense_count,
    }
  })
}

export function emptyMonthlyBreakdown(month: string): MonthlyBreakdown {
  return createEmptyBreakdown(month)
}

export function emptyMonthlySummary(month: string): MonthlySummary {
  return {
    month,
    month_label: formatMonthLabel(month),
    installment_total_cents: 0,
    monthly_total_cents: 0,
    total_amount_cents: 0,
    item_count: 0,
    purchase_count: 0,
    installment_count: 0,
    monthly_expense_count: 0,
  }
}

export function getLineItemSourceLabel(lineItem: MonthlyLineItem) {
  if (lineItem.source_type === "monthly_expense") {
    return "Mensal"
  }

  return lineItem.installment_index && lineItem.installment_count
    ? `${lineItem.installment_index}/${lineItem.installment_count}`
    : "Parcela"
}

export function getMonthlyExpensePeriodLabel(
  monthlyExpense: Pick<MonthlyExpenseRecord, "start_month" | "end_month">
) {
  const start = formatMonthLabel(normalizeMonthValue(monthlyExpense.start_month))

  if (!monthlyExpense.end_month) {
    return `Desde ${start}`
  }

  return `${start} até ${formatMonthLabel(normalizeMonthValue(monthlyExpense.end_month))}`
}

export function getSourceSplitPercentages(breakdown: MonthlyBreakdown) {
  if (breakdown.total_amount_cents <= 0) {
    return {
      installments: 0,
      monthly: 0,
    }
  }

  return {
    installments: Math.round(
      (breakdown.installment_total_cents / breakdown.total_amount_cents) * 100
    ),
    monthly: Math.round(
      (breakdown.monthly_total_cents / breakdown.total_amount_cents) * 100
    ),
  }
}

export function getMonthlyTrendMax(summaries: MonthlySummary[]) {
  return summaries.reduce(
    (max, summary) => Math.max(max, summary.total_amount_cents),
    0
  )
}

export function getProgressPercentage(value: number, max: number) {
  if (max <= 0) {
    return 0
  }

  return clamp(Math.round((value / max) * 100), 2, 100)
}

export function formatCurrencyFromCents(value: number) {
  return currencyFormatter.format(value / 100)
}

export function formatMonthLabel(monthKey: string) {
  const { year, month } = assertCalculatedMonthKey(monthKey)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, 1)
  date.setUTCHours(0, 0, 0, 0)

  return capitalizeLabel(monthFormatter.format(date))
}

export function formatDateLabel(dateValue: string) {
  assertDateValue(dateValue)
  return dateFormatter.format(new Date(`${dateValue}T12:00:00Z`))
}

export function formatCentsForInput(value: number) {
  return (value / 100).toFixed(2).replace(".", ",")
}

export function parseCurrencyInputToCents(rawValue: string) {
  let sanitized = rawValue.trim()
  if (/^R\$\s*/i.test(sanitized)) {
    sanitized = sanitized.replace(/^R\$\s*/i, "")
  }

  if (!sanitized || /[^\d.,]/.test(sanitized)) {
    return null
  }

  let integerPart = sanitized
  let decimalPart = ""

  const groupedIntegerMatch = /^(\d{1,3})([.,]\d{3})+$/.test(sanitized)
  if (groupedIntegerMatch) {
    const separators = sanitized.match(/[.,]/g) ?? []
    if (separators.every((separator) => separator === separators[0])) {
      integerPart = sanitized.replace(/[.,]/g, "")
    } else {
      return null
    }
  } else if (!/^\d+$/.test(sanitized)) {
    const lastCommaIndex = sanitized.lastIndexOf(",")
    const lastDotIndex = sanitized.lastIndexOf(".")
    const decimalSeparatorIndex = Math.max(lastCommaIndex, lastDotIndex)
    const decimalSeparator = sanitized[decimalSeparatorIndex]

    integerPart = sanitized.slice(0, decimalSeparatorIndex)
    decimalPart = sanitized.slice(decimalSeparatorIndex + 1)

    if (!/^\d{1,2}$/.test(decimalPart)) {
      return null
    }

    if (integerPart.includes(",") || integerPart.includes(".")) {
      if (!/^\d{1,3}([.,]\d{3})+$/.test(integerPart)) {
        return null
      }

      const groupingSeparators = integerPart.match(/[.,]/g) ?? []
      if (
        !groupingSeparators.every(
          (separator) => separator === groupingSeparators[0]
        ) ||
        groupingSeparators[0] === decimalSeparator
      ) {
        return null
      }

      integerPart = integerPart.replace(/[.,]/g, "")
    } else if (!/^\d+$/.test(integerPart)) {
      return null
    }
  }

  const amountCents =
    BigInt(integerPart) * BigInt(100) + BigInt(decimalPart.padEnd(2, "0") || "0")
  if (amountCents > BigInt(MAX_AMOUNT_CENTS)) {
    return null
  }

  return Number(amountCents)
}

export function parseDashboardFilters(
  searchParams: Record<string, string | string[] | undefined>
): DashboardFilters {
  const query = firstSearchParamValue(searchParams.q).trim().slice(0, 80)
  const rawStatus = firstSearchParamValue(searchParams.status)
  const rawIncludeDisabled = firstSearchParamValue(searchParams.includeDisabled)
  const month = firstSearchParamValue(searchParams.month)
  const flash = firstSearchParamValue(searchParams.flash).trim()
  const rawView = firstSearchParamValue(searchParams.view)

  return {
    query,
    status:
      rawStatus === "active" ||
      rawStatus === "completed" ||
      rawStatus === "disabled"
        ? rawStatus
        : "all",
    includeDisabled: rawIncludeDisabled === "1" || rawIncludeDisabled === "true",
    month: isValidMonthKey(month) ? month : "",
    cardId: firstSearchParamValue(searchParams.card).trim(),
    view: isDashboardView(rawView) ? rawView : "purchases",
    editId: firstSearchParamValue(searchParams.edit).trim(),
    monthlyEditId: firstSearchParamValue(searchParams.editMonthly).trim(),
    flash,
  }
}

export function buildReturnToPath(
  filters: Pick<DashboardFilters, "query" | "status" | "month" | "cardId" | "view"> &
    Partial<Pick<DashboardFilters, "includeDisabled">>,
  extras?: Record<string, string | undefined>
) {
  const params = new URLSearchParams()

  if (filters.query) {
    params.set("q", filters.query)
  }

  if (filters.status !== "all") {
    params.set("status", filters.status)
  }

  if (filters.includeDisabled) {
    params.set("includeDisabled", "1")
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
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  ) {
    return "/"
  }

  try {
    const resolvedUrl = new URL(value, "http://expenses-counter.local")
    if (resolvedUrl.origin !== "http://expenses-counter.local") {
      return "/"
    }
  } catch {
    return "/"
  }

  return value
}
