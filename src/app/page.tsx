import { DesktopDashboard } from "@/components/dashboard/desktop-dashboard"
import { MobileDashboardShell } from "@/components/dashboard/mobile-dashboard-shell"
import { getDashboardData } from "@/lib/dashboard"
import {
  buildReturnToPath,
  formatCentsForInput,
  getCurrentMonthKey,
} from "@/lib/purchases"
import type { PurchaseFormValues } from "@/lib/types"

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = "force-dynamic"

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams
  const dashboard = await getDashboardData(resolvedSearchParams)
  const currentMonth = getCurrentMonthKey()
  const returnTo = buildReturnToPath(dashboard.filters)
  const focusColumnLabel =
    dashboard.focusMonth === currentMonth
      ? "Parcela neste mês"
      : `Parcela em ${dashboard.focusSummary.month_label}`
  const formValues: PurchaseFormValues = dashboard.selectedPurchase
    ? {
        purchaseId: dashboard.selectedPurchase.id,
        description: dashboard.selectedPurchase.description,
        purchaseDate: dashboard.selectedPurchase.purchase_date,
        firstInstallmentMonth:
          dashboard.selectedPurchase.first_installment_month.slice(0, 7),
        installmentCount: dashboard.selectedPurchase.installment_count,
        totalAmount: formatCentsForInput(
          dashboard.selectedPurchase.total_amount_cents
        ),
        cardId: dashboard.selectedPurchase.card_id,
        notes: dashboard.selectedPurchase.notes ?? "",
        redirectTo: returnTo,
      }
    : {
        description: "",
        purchaseDate: new Date().toISOString().slice(0, 10),
        firstInstallmentMonth: dashboard.filters.month || currentMonth,
        installmentCount: 1,
        totalAmount: "",
        cardId: dashboard.defaultCard.id,
        notes: "",
        redirectTo: returnTo,
      }

  return (
    <main className="min-h-screen px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <MobileDashboardShell
          dashboard={dashboard}
          focusColumnLabel={focusColumnLabel}
          formValues={formValues}
          returnTo={returnTo}
        />
        <DesktopDashboard
          dashboard={dashboard}
          focusColumnLabel={focusColumnLabel}
          formValues={formValues}
          returnTo={returnTo}
        />
      </div>
    </main>
  )
}
