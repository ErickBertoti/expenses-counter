"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarClockIcon, PlusIcon } from "lucide-react"

import { signOut } from "@/app/actions"
import { ExpenseComposerLink } from "@/components/dashboard/expense-composer-link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { resolveDashboardMonthHref } from "@/lib/dashboard-url"
import { buildReturnToPath } from "@/lib/purchases"
import type { DashboardFilters, DashboardView } from "@/lib/types"
import { cn } from "@/lib/utils"

const views: { view: DashboardView; label: string }[] = [
  { view: "summary", label: "Visão geral" },
  { view: "purchases", label: "Compras" },
  { view: "monthly", label: "Mensalidades" },
]

type DesktopDashboardHeaderProps = {
  filters: DashboardFilters
  focusMonth: string
  email?: string
}

export function DesktopDashboardHeader({ filters, focusMonth, email }: DesktopDashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function selectMonth(month: string) {
    if (!month || month === focusMonth) return
    const search = searchParams.toString()
    router.replace(resolveDashboardMonthHref(search ? `${pathname}?${search}` : pathname, month), {
      scroll: false,
    })
  }

  return (
    <header className="sticky top-0 z-20 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h1 className="shrink-0 font-heading text-lg font-semibold tracking-tight">
          Contador de despesas
        </h1>
        <label className="grid w-56 shrink-0 gap-1 text-xs font-medium text-muted-foreground">
          Mês em foco
          <Input
            type="month"
            value={focusMonth}
            onChange={(event) => selectMonth(event.target.value)}
            className="bg-background text-foreground"
          />
        </label>
        <div className="flex shrink-0 items-center gap-2">
          <ExpenseComposerLink
            href={buildReturnToPath(filters, { compose: "purchase" })}
            data-expense-trigger="purchase"
            className={buttonVariants()}
          >
            <PlusIcon data-icon="inline-start" />
            Nova compra
          </ExpenseComposerLink>
          <ExpenseComposerLink
            href={buildReturnToPath(filters, { compose: "monthly" })}
            data-expense-trigger="monthly"
            className={buttonVariants({ variant: "outline" })}
          >
            <CalendarClockIcon data-icon="inline-start" />
            Nova mensalidade
          </ExpenseComposerLink>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2">
        <nav aria-label="Seções do dashboard" className="flex gap-1">
          {views.map(({ view, label }) => (
            <Link
              key={view}
              href={buildReturnToPath({ ...filters, view })}
              scroll={false}
              onNavigate={() => window.scrollTo({ top: 0, behavior: "instant" })}
              aria-current={filters.view === view ? "page" : undefined}
              className={cn(buttonVariants({ variant: filters.view === view ? "secondary" : "ghost", size: "sm" }))}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex min-w-0 items-center gap-3">
          <span className="break-all text-xs text-muted-foreground">
            {email}
          </span>
          <form action={signOut}>
            <Button variant="ghost" type="submit">Sair</Button>
          </form>
        </div>
      </div>
    </header>
  )
}
