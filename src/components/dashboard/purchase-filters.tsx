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

type PurchaseFiltersProps = {
  cards: CardRecord[]
  filters: DashboardFilters
  showCardFilter: boolean
}

function resolveFilterHref(
  pathname: string,
  searchParamsString: string,
  updates: Partial<Record<"q" | "status" | "month" | "card", string>>
) {
  const params = new URLSearchParams(searchParamsString)

  for (const [key, value] of Object.entries(updates)) {
    const shouldDelete = !value || (key === "status" && value === "all")

    if (shouldDelete) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
  }

  params.delete("edit")
  params.delete("flash")

  const nextQuery = params.toString()
  return nextQuery ? `${pathname}?${nextQuery}` : pathname
}

export function PurchaseFilters({
  cards,
  filters,
  showCardFilter,
}: PurchaseFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(filters.query)
  const deferredQuery = useDeferredValue(query)
  const searchParamsString = searchParams.toString()

  function replaceFilters(
    updates: Partial<Record<"q" | "status" | "month" | "card", string>>
  ) {
    startTransition(() => {
      router.replace(resolveFilterHref(pathname, searchParamsString, updates), {
        scroll: false,
      })
    })
  }

  function resetFilters() {
    setQuery("")
    replaceFilters({
      q: "",
      status: "all",
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
        resolveFilterHref(pathname, searchParamsString, {
          q: deferredQuery.trim(),
        }),
        {
          scroll: false,
        }
      )
    })
  }, [deferredQuery, filters.query, pathname, router, searchParamsString])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">Filtros</h2>
        <p className="text-sm text-muted-foreground">
          Busque por descrição, foque um mês específico e separe compras ativas
          das concluídas.
        </p>
      </div>

      <FieldGroup className="gap-4 md:grid md:grid-cols-2 lg:grid-cols-[minmax(0,1.8fr)_repeat(3,minmax(0,1fr))]">
        <Field>
          <FieldLabel htmlFor="filter-query">Buscar compra</FieldLabel>
          <FieldContent>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="filter-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex.: notebook, viagem, curso"
                className="pl-9"
              />
            </div>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="filter-status">Status</FieldLabel>
          <FieldContent>
            <Select
              id="filter-status"
              value={filters.status}
              onValueChange={(value) => replaceFilters({ status: value ?? "all" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="filter-month">Mês</FieldLabel>
          <FieldContent>
            <Input
              id="filter-month"
              type="month"
              value={filters.month}
              onChange={(event) => replaceFilters({ month: event.target.value })}
            />
          </FieldContent>
        </Field>

        {showCardFilter ? (
          <Field>
            <FieldLabel htmlFor="filter-card">Cartão</FieldLabel>
            <FieldContent>
              <Select
                id="filter-card"
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
        ) : (
          <div className="flex items-end md:col-span-2 lg:col-span-1">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={resetFilters}
            >
              <RotateCcwIcon data-icon="inline-start" />
              Limpar filtros
            </Button>
          </div>
        )}
      </FieldGroup>

      {showCardFilter ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={resetFilters}
          >
            <RotateCcwIcon data-icon="inline-start" />
            Limpar filtros
          </Button>
        </div>
      ) : null}
    </div>
  )
}
