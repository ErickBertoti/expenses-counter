import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { buildReturnToPath } from "@/lib/purchases"
import type { DashboardFilters, DashboardView } from "@/lib/types"
import { cn } from "@/lib/utils"

const dashboardViews: { value: DashboardView; label: string }[] = [
  { value: "purchases", label: "Compras" },
  { value: "summary", label: "Resumo" },
  { value: "monthly", label: "Mensais" },
]

type DashboardViewTabsProps = {
  filters: Pick<
    DashboardFilters,
    "query" | "status" | "includeDisabled" | "month" | "cardId" | "view"
  >
  className?: string
}

export function DashboardViewTabs({
  className,
  filters,
}: DashboardViewTabsProps) {
  return (
    <nav
      aria-label="Visão do dashboard"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-muted p-1",
        className
      )}
    >
      {dashboardViews.map((view) => {
        const isCurrentView = filters.view === view.value

        return (
          <Link
            key={view.value}
            href={buildReturnToPath({ ...filters, view: view.value })}
            scroll={false}
            aria-current={isCurrentView ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: isCurrentView ? "secondary" : "ghost",
                size: "sm",
              }),
              "min-w-0 flex-1 justify-center"
            )}
          >
            {view.label}
          </Link>
        )
      })}
    </nav>
  )
}
