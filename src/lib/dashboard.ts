import { redirect } from "next/navigation"

import { createClient } from "@/lib/server"
import { buildMonthlyExportModel } from "@/lib/monthly-export"
import { buildDashboardAnalytics } from "@/lib/analytics"
import {
  buildMonthlyBreakdowns,
  buildMonthlyExpenseWithCard,
  buildMonthlySummaries,
  buildPurchaseWithProgress,
  emptyMonthlyBreakdown,
  emptyMonthlySummary,
  filterMonthlyExpenses,
  filterPurchases,
  getCurrentMonthKey,
  parseDashboardFilters,
  sortMonthlyExpensesForDashboard,
  sortPurchasesForDashboard,
  shouldIncludeDisabledInAnalytics,
} from "@/lib/purchases"
import type {
  CardRecord,
  MonthlyExpenseRecord,
  MonthlySummary,
  PurchaseRecord,
} from "@/lib/types"

async function getOrCreateCards(userId: string) {
  const supabase = await createClient()
  const { data: cards, error } = await supabase
    .from("cards")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  if (cards.length > 0) {
    return cards as CardRecord[]
  }

  const { data: createdCard, error: createError } = await supabase
    .from("cards")
    .insert({
      user_id: userId,
      name: "Cartão principal",
      is_default: true,
    })
    .select("*")
    .single()

  if (createError) {
    throw new Error(createError.message)
  }

  return [createdCard as CardRecord]
}

async function getPurchases(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as PurchaseRecord[]
}

async function getMonthlyExpenses(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("monthly_expenses")
    .select("*")
    .eq("user_id", userId)
    .order("start_month", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as MonthlyExpenseRecord[]
}

export async function getDashboardData(
  searchParams: Record<string, string | string[] | undefined>
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const filters = parseDashboardFilters(searchParams)
  const currentMonth = getCurrentMonthKey()

  const [cards, purchaseRecords, monthlyExpenseRecords] = await Promise.all([
    getOrCreateCards(user.id),
    getPurchases(user.id),
    getMonthlyExpenses(user.id),
  ])

  const cardNameById = new Map(cards.map((card) => [card.id, card.name]))
  const purchasesWithProgress = purchaseRecords.map((purchase) =>
    buildPurchaseWithProgress(
      purchase,
      cardNameById.get(purchase.card_id) ?? "Cartão",
      currentMonth
    )
  )
  const monthlyExpensesWithCard = monthlyExpenseRecords.map((monthlyExpense) =>
    buildMonthlyExpenseWithCard(
      monthlyExpense,
      cardNameById.get(monthlyExpense.card_id) ?? "Cartão"
    )
  )
  const filteredPurchases = sortPurchasesForDashboard(
    filterPurchases(purchasesWithProgress, filters)
  )
  const filteredMonthlyExpenses = sortMonthlyExpensesForDashboard(
    filterMonthlyExpenses(monthlyExpensesWithCard, filters)
  )
  const summaryFilters = {
    ...filters,
    month: "",
  }
  const summaryPurchases = filterPurchases(purchasesWithProgress, summaryFilters)
  const summaryMonthlyExpenses = filterMonthlyExpenses(
    monthlyExpensesWithCard,
    summaryFilters
  )
  const includeDisabledInAnalytics = shouldIncludeDisabledInAnalytics(filters)
  const selectedPurchase =
    purchaseRecords.find((purchase) => purchase.id === filters.editId) ?? null
  const selectedMonthlyExpense =
    monthlyExpenseRecords.find(
      (monthlyExpense) => monthlyExpense.id === filters.monthlyEditId
    ) ?? null
  const focusMonth = filters.month || currentMonth
  const monthlyBreakdowns = buildMonthlyBreakdowns({
    focusMonth,
    includeDisabled: includeDisabledInAnalytics,
    monthlyExpenses: summaryMonthlyExpenses,
    purchases: summaryPurchases,
    referenceMonthKey: currentMonth,
  })
  const monthlySummaries = buildMonthlySummaries(
    summaryPurchases,
    summaryMonthlyExpenses,
    {
      focusMonth,
      includeDisabled: includeDisabledInAnalytics,
      referenceMonthKey: currentMonth,
    }
  )
  const focusSummary =
    monthlySummaries.find((summary) => summary.month === focusMonth) ??
    emptyMonthlySummary(focusMonth)
  const focusBreakdown =
    monthlyBreakdowns.find((breakdown) => breakdown.month === focusMonth) ??
    emptyMonthlyBreakdown(focusMonth)
  const analytics = buildDashboardAnalytics({
    breakdowns: monthlyBreakdowns,
    currentMonth,
    focusBreakdown,
    focusMonth,
    purchases: summaryPurchases,
    summaries: monthlySummaries,
  })
  const exportBreakdowns = buildMonthlyBreakdowns({
    focusMonth,
    monthlyExpenses: monthlyExpensesWithCard,
    purchases: purchasesWithProgress,
    referenceMonthKey: currentMonth,
  })
  const focusExportBreakdown =
    exportBreakdowns.find((breakdown) => breakdown.month === focusMonth) ??
    emptyMonthlyBreakdown(focusMonth)
  const monthlyExport = buildMonthlyExportModel({
    breakdown: focusExportBreakdown,
    monthlyExpenses: monthlyExpensesWithCard,
    purchases: purchasesWithProgress,
  })
  const activePurchaseCount = filteredPurchases.filter(
    (purchase) => purchase.status === "active"
  ).length
  const remainingAmountCents = filteredPurchases.reduce(
    (total, purchase) =>
      purchase.status === "disabled" && !includeDisabledInAnalytics
        ? total
        : total + purchase.remaining_amount_cents,
    0
  )
  const activeMonthlyExpenseCount = filteredMonthlyExpenses.filter(
    (monthlyExpense) => !monthlyExpense.is_disabled
  ).length
  const defaultCard = cards.find((card) => card.is_default) ?? cards[0]

  return {
    analytics,
    activePurchaseCount,
    activeMonthlyExpenseCount,
    cards,
    defaultCard,
    filters,
    focusBreakdown,
    focusMonth,
    focusSummary: focusSummary as MonthlySummary,
    monthlyExport,
    monthlyBreakdowns,
    monthlyExpenses: filteredMonthlyExpenses,
    monthlySummaries,
    purchases: filteredPurchases,
    remainingAmountCents,
    selectedMonthlyExpense,
    selectedPurchase,
    user,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
