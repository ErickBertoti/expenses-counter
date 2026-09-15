"use client"

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from "react"
import { RotateCcwIcon, SearchIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CardRecord, DashboardFilters } from "@/lib/types"
import { resolveDashboardHref } from "@/lib/dashboard-url"
import { cn } from "@/lib/utils"

type PurchaseFiltersProps = {
  cards: CardRecord[]
  className?: string
  filters: DashboardFilters
  idPrefix?: string
  showCardFilter: boolean
  variant?: "desktop" | "mobile"
}

export function PurchaseFilters({
  cards,
  className,
  filters,
  idPrefix = "purchase-filters",
  showCardFilter,
  variant = "desktop",
}: PurchaseFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(filters.query)
  const deferredQuery = useDeferredValue(query)
  const searchParamsString = searchParams.toString()
  const isMobile = variant === "mobile"

  function fieldId(name: string) {
    return `${idPrefix}-${name}`
  }

  function replaceFilters(
    updates: Partial<
      Record<"q" | "status" | "month" | "card" | "includeDisabled", string>
    >
  ) {
    startTransition(() => {
      router.replace(resolveDashboardHref(pathname, searchParamsString, updates), {
        scroll: false,
      })
    })
  }

  function resetFilters() {
    setQuery("")
    replaceFilters({
      q: "",
      status: "all",
      includeDisabled: "",
      month: "",
      card: "",
    })
  }

  useEffect(() => {
    if (deferredQuery === filters.query) {
      return
    }

    startTransition(() => {
      router.replace(
        resolveDashboardHref(pathname, searchParamsString, {
          q: deferredQuery.trim(),
        }),
        {
          scroll: false,
        }
      )
    })
  }, [deferredQuery, filters.query, pathname, router, searchParamsString])

  return (
    <div className={cn("flex flex-col", isMobile ? "gap-4" : "gap-5", className)}>
      {isMobile ? null : (
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">Filtros</h2>
          <p className="text-sm text-muted-foreground">
            Busque por descrição, foque um mês específico e separe compras ativas
            das concluídas.
          </p>
        </div>
      )}

      <FieldGroup
        className={cn(
          "gap-4",
          isMobile
            ? ""
            : "md:grid md:grid-cols-2 lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))]"
        )}
      >
        <Field>
          <FieldLabel htmlFor={fieldId("query")}>Buscar compra</FieldLabel>
          <FieldContent>
            <div className="relative">
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={fieldId("query")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex.: notebook, viagem, curso"
                className="pl-9"
                enterKeyHint="search"
              />
            </div>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor={fieldId("status")}>Status</FieldLabel>
          <FieldContent>
            <Select
              id={fieldId("status")}
              value={filters.status}
              onValueChange={(value) => replaceFilters({ status: value ?? "all" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Em andamento e concluídas</SelectItem>
                  <SelectItem value="active">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="disabled">Desativadas</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor={fieldId("month")}>Mês</FieldLabel>
          <FieldContent>
            <Input
              id={fieldId("month")}
              type="month"
              value={filters.month}
              onChange={(event) => replaceFilters({ month: event.target.value })}
            />
          </FieldContent>
        </Field>

        {showCardFilter ? (
          <Field>
            <FieldLabel htmlFor={fieldId("card")}>Cartão</FieldLabel>
            <FieldContent>
              <Select
                id={fieldId("card")}
                value={filters.cardId || "all"}
                onValueChange={(value) =>
                  replaceFilters({ card: value === "all" ? "" : value ?? "" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todos os cartões</SelectItem>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
        ) : null}
      </FieldGroup>

      <button
        type="button"
        role="switch"
        aria-checked={filters.includeDisabled}
        onClick={() =>
          replaceFilters({ includeDisabled: filters.includeDisabled ? "" : "1" })
        }
        className="flex w-full items-center gap-3 rounded-md border border-border bg-muted/50 p-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors",
            filters.includeDisabled
              ? "border-primary bg-primary"
              : "border-input bg-background"
          )}
        >
          <span
            className={cn(
              "size-4 rounded-full bg-current shadow-sm transition-transform",
              filters.includeDisabled
                ? "translate-x-5 text-primary-foreground"
                : "translate-x-1 text-muted-foreground"
            )}
          />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">Incluir desativadas nos totais</span>
          <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
            {filters.includeDisabled
              ? "Ativo nesta visão, sem reativar as compras."
              : "Mostre-as e some seus valores sem alterar o estado salvo."}
          </span>
        </span>
      </button>

      <div className={cn("flex", isMobile ? "" : "justify-end")}>
        <Button
          type="button"
          variant="outline"
          className={cn(isMobile ? "w-full" : "w-full sm:w-auto")}
          onClick={resetFilters}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Limpar filtros
        </Button>
      </div>
    </div>
  )
}
