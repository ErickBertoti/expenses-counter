import { redirect } from "next/navigation"

import { createClient } from "@/lib/server"
import {
  buildMonthlySummaries,
  buildPurchaseWithProgress,
  emptyMonthlySummary,
  filterPurchases,
  getCurrentMonthKey,
  parseDashboardFilters,
  sortPurchasesForDashboard,
} from "@/lib/purchases"
import type { CardRecord, MonthlySummary, PurchaseRecord } from "@/lib/types"

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

  const [cards, purchaseRecords] = await Promise.all([
    getOrCreateCards(user.id),
    getPurchases(user.id),
  ])

  const cardNameById = new Map(cards.map((card) => [card.id, card.name]))
  const purchasesWithProgress = purchaseRecords.map((purchase) =>
    buildPurchaseWithProgress(
      purchase,
      cardNameById.get(purchase.card_id) ?? "Cartão",
      currentMonth
    )
  )
  const filteredPurchases = sortPurchasesForDashboard(
    filterPurchases(purchasesWithProgress, filters)
  )
  const selectedPurchase =
    purchaseRecords.find((purchase) => purchase.id === filters.editId) ?? null
  const monthlySummaries = buildMonthlySummaries(filteredPurchases)
  const focusMonth = filters.month || currentMonth
  const focusSummary =
    monthlySummaries.find((summary) => summary.month === focusMonth) ??
    emptyMonthlySummary(focusMonth)
  const activePurchaseCount = filteredPurchases.filter(
    (purchase) => purchase.status === "active"
  ).length
  const remainingAmountCents = filteredPurchases.reduce(
    (total, purchase) => total + purchase.remaining_amount_cents,
    0
  )
  const defaultCard = cards.find((card) => card.is_default) ?? cards[0]

  return {
    activePurchaseCount,
    cards,
    defaultCard,
    filters,
    focusMonth,
    focusSummary: focusSummary as MonthlySummary,
    monthlySummaries,
    purchases: filteredPurchases,
    remainingAmountCents,
    selectedPurchase,
    user,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
