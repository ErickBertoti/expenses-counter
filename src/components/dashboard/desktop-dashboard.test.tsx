import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { buildDashboardAnalytics } from "@/lib/analytics"
import type { DashboardData } from "@/lib/dashboard"
import { buildMonthlyExportModel } from "@/lib/monthly-export"
import {
  buildReturnToPath,
  emptyMonthlyBreakdown,
  emptyMonthlySummary,
  parseDashboardFilters,
} from "@/lib/purchases"
import { DesktopDashboard } from "./desktop-dashboard"
import { MonthlyAnalytics } from "./monthly-analytics"

vi.mock("@/app/actions", () => ({ signOut: vi.fn() }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))

function fixture(params: Record<string, string | undefined> = {}): DashboardData {
  const focusMonth = params.month || "2026-11"
  const focusBreakdown = emptyMonthlyBreakdown(focusMonth)
  return {
    filters: parseDashboardFilters(params),
    focusMonth,
    focusSummary: emptyMonthlySummary(focusMonth),
    focusBreakdown,
    analytics: buildDashboardAnalytics({
      breakdowns: [], summaries: [], purchases: [],
      currentMonth: focusMonth, focusMonth, focusBreakdown,
    }),
    monthlyExport: buildMonthlyExportModel({ breakdown: focusBreakdown, purchases: [], monthlyExpenses: [] }),
    activePurchaseCount: 0,
    activeMonthlyExpenseCount: 0,
    remainingAmountCents: 0,
    cards: [], purchases: [], monthlyExpenses: [], monthlySummaries: [], monthlyBreakdowns: [],
    defaultCard: { id: "card-1", user_id: "user-1", name: "Cartão principal", is_default: true, created_at: "2026-01-01", updated_at: "2026-01-01" },
    user: { id: "user-1", email: "teste@example.com", app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-01-01" },
  }
}

function renderDashboard(params: Record<string, string | undefined> = {}) {
  const dashboard = fixture(params)
  return renderToStaticMarkup(
    <DesktopDashboard dashboard={dashboard} focusColumnLabel="Parcela neste mês" returnTo={buildReturnToPath(dashboard.filters)} />
  )
}

describe("desktop dashboard sections", () => {
  it.each([{}, { view: "unknown" }])("opens purchases by default: %j", (params) => {
    const html = renderDashboard(params)
    expect(html).toContain("Compras cadastradas")
    expect(html).not.toContain("Painel de compromissos previstos")
    expect(html).not.toContain("Nenhuma mensalidade encontrada")
    expect(html).not.toContain("EXPORTAR MÊS")
    expect(html).toMatch(/<a[^>]+aria-current="page"[^>]*>Compras<\/a>/)
  })

  it("renders only monthly expenses in the monthly view", () => {
    const html = renderDashboard({ view: "monthly" })
    expect(html).toContain("Nenhuma mensalidade encontrada")
    expect(html).not.toContain("Compras cadastradas")
    expect(html).not.toContain("Painel de compromissos previstos")
    expect(html).toMatch(/<a[^>]+aria-current="page"[^>]*>Mensalidades<\/a>/)
  })

  it("puts analytics, monthly summary and export in overview order", () => {
    const html = renderDashboard({ view: "summary" })
    expect(html).not.toContain("Compras cadastradas")
    expect(html).not.toContain("Nenhuma mensalidade encontrada")
    expect(html.indexOf("Painel de compromissos previstos")).toBeGreaterThan(-1)
    expect(html.indexOf("Resumo mensal")).toBeGreaterThan(html.indexOf("Painel de compromissos previstos"))
    expect(html.indexOf("Exportar resumo")).toBeGreaterThan(html.indexOf("Resumo mensal"))
    expect((html.match(/type="month"/g) ?? [])).toHaveLength(1)
    expect(html).toMatch(/<a[^>]+aria-current="page"[^>]*>Visão geral<\/a>/)
  })

  it("keeps filters in section and composer links and exposes them before the list", () => {
    const params = { q: "curso", status: "active", card: "card-1", month: "2026-12", includeDisabled: "1" }
    const html = renderDashboard(params).replaceAll("&amp;", "&")
    const base = "/?q=curso&status=active&includeDisabled=1&month=2026-12&card=card-1"
    expect(html).toContain(`href="${base}&view=summary"`)
    expect(html).toContain(`href="${base}&view=monthly"`)
    expect(html).toContain(`href="${base}&compose=purchase"`)
    expect(html).toContain(`href="${base}&compose=monthly"`)
    expect(html.indexOf("Buscar compra")).toBeLessThan(html.indexOf("Compras cadastradas"))
    expect((html.match(/type="month"/g) ?? [])).toHaveLength(1)
  })

  it("retains the month selector in analytics by default for mobile", () => {
    const dashboard = fixture()
    const html = renderToStaticMarkup(<MonthlyAnalytics analytics={dashboard.analytics} focusMonth={dashboard.focusMonth} />)
    expect(html).toContain("Mês em foco")
    expect(html).toContain('type="month"')
  })
})
