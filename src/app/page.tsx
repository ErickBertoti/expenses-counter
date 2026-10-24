import { ExpenseComposer } from "@/components/dashboard/expense-composer"
import { DesktopDashboard } from "@/components/dashboard/desktop-dashboard"
import { MobileDashboardShell } from "@/components/dashboard/mobile-dashboard-shell"
import { getDashboardData } from "@/lib/dashboard"
import {
  buildReturnToPath,
  getCurrentMonthKey,
} from "@/lib/purchases"

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = "force-dynamic"

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams
  const { composerData, ...dashboard } = await getDashboardData(resolvedSearchParams)
  const currentMonth = getCurrentMonthKey()
  const returnTo = buildReturnToPath(dashboard.filters)
  const focusColumnLabel =
    dashboard.focusMonth === currentMonth
      ? "Parcela neste mês"
      : `Parcela em ${dashboard.focusSummary.month_label}`

  return (
    <main className="min-h-screen px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <MobileDashboardShell
          dashboard={dashboard}
          focusColumnLabel={focusColumnLabel}
          returnTo={returnTo}
        />
        <DesktopDashboard
          dashboard={dashboard}
          focusColumnLabel={focusColumnLabel}
          returnTo={returnTo}
        />
        <ExpenseComposer
          cards={dashboard.cards}
          data={composerData}
          returnTo={returnTo}
        />
      </div>
    </main>
  )
}
