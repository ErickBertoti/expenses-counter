"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { CalendarClockIcon, Loader2Icon, PencilLineIcon } from "lucide-react"

import { saveMonthlyExpense } from "@/app/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerHeading,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Field,
  FieldContent,
  FieldDescription,
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
import { Textarea } from "@/components/ui/textarea"
import type {
  CardRecord,
  MonthlyExpenseFormState,
  MonthlyExpenseFormValues,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const initialState: MonthlyExpenseFormState = {
  status: "idle",
}

type MonthlyExpenseFormProps = {
  cards: CardRecord[]
  idPrefix?: string
  initialValues: MonthlyExpenseFormValues
  isEditing: boolean
  returnTo: string
  variant?: "desktop" | "mobile"
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-destructive">{message}</p>
}

export function MonthlyExpenseForm({
  cards,
  idPrefix = "monthly-expense-form",
  initialValues,
  isEditing,
  returnTo,
  variant = "desktop",
}: MonthlyExpenseFormProps) {
  const [state, formAction, pending] = useActionState(
    saveMonthlyExpense,
    initialState
  )
  const [selectedCardId, setSelectedCardId] = useState(initialValues.cardId)
  const isMobile = variant === "mobile"
  const title = isEditing ? "Editar mensalidade" : "Nova mensalidade"
  const description = isMobile
    ? "Registre um custo que se repete mês a mês."
    : "Use para academia, assinatura, plano ou qualquer gasto que entra todo mês."

  function fieldId(name: string) {
    return `${idPrefix}-${name}`
  }

  const alertMessage = state.message ? (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        state.status === "error"
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]"
      )}
    >
      {state.message}
    </div>
  ) : null

  const fields = (
    <FieldGroup className={cn(isMobile ? "gap-4" : "gap-5")}>
      <Field data-invalid={Boolean(state.fieldErrors?.description) || undefined}>
        <FieldLabel htmlFor={fieldId("description")}>Descrição</FieldLabel>
        <FieldContent>
          <Input
            id={fieldId("description")}
            name="description"
            defaultValue={initialValues.description}
            placeholder="Ex.: Academia, streaming, plano"
            aria-invalid={Boolean(state.fieldErrors?.description) || undefined}
            autoCapitalize="sentences"
            autoComplete="off"
            required
          />
          <FieldError message={state.fieldErrors?.description} />
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.amount) || undefined}>
        <FieldLabel htmlFor={fieldId("amount")}>Valor mensal</FieldLabel>
        <FieldContent>
          <Input
            id={fieldId("amount")}
            name="amount"
            defaultValue={initialValues.amount}
            inputMode="decimal"
            placeholder="Ex.: 129,90"
            aria-invalid={Boolean(state.fieldErrors?.amount) || undefined}
            autoComplete="off"
            spellCheck={false}
            required
          />
          <FieldError message={state.fieldErrors?.amount} />
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.cardId) || undefined}>
        <FieldLabel htmlFor={fieldId("cardId")}>Cartão</FieldLabel>
        <FieldContent>
          <Select
            id={fieldId("cardId")}
            name="cardId"
            value={selectedCardId}
            onValueChange={(value) => setSelectedCardId(value ?? "")}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={Boolean(state.fieldErrors?.cardId) || undefined}
            >
              <SelectValue placeholder="Selecione um cartão" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldError message={state.fieldErrors?.cardId} />
        </FieldContent>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(state.fieldErrors?.startMonth) || undefined}>
          <FieldLabel htmlFor={fieldId("startMonth")}>Mês inicial</FieldLabel>
          <FieldContent>
            <Input
              id={fieldId("startMonth")}
              name="startMonth"
              type="month"
              defaultValue={initialValues.startMonth}
              aria-invalid={Boolean(state.fieldErrors?.startMonth) || undefined}
              required
            />
            <FieldError message={state.fieldErrors?.startMonth} />
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(state.fieldErrors?.endMonth) || undefined}>
          <FieldLabel htmlFor={fieldId("endMonth")}>Mês final</FieldLabel>
          <FieldContent>
            <Input
              id={fieldId("endMonth")}
              name="endMonth"
              type="month"
              defaultValue={initialValues.endMonth}
              aria-invalid={Boolean(state.fieldErrors?.endMonth) || undefined}
            />
            {!isMobile ? (
              <FieldDescription>Deixe vazio para repetir sem prazo.</FieldDescription>
            ) : null}
            <FieldError message={state.fieldErrors?.endMonth} />
          </FieldContent>
        </Field>
      </div>

      <Field data-invalid={Boolean(state.fieldErrors?.notes) || undefined}>
        <FieldLabel htmlFor={fieldId("notes")}>Observações</FieldLabel>
        <FieldContent>
          <Textarea
            id={fieldId("notes")}
            name="notes"
            defaultValue={initialValues.notes}
            placeholder="Opcional. Ex.: vence no dia 10, reajuste anual."
            aria-invalid={Boolean(state.fieldErrors?.notes) || undefined}
            rows={isMobile ? 3 : 4}
          />
          <FieldError message={state.fieldErrors?.notes} />
        </FieldContent>
      </Field>
    </FieldGroup>
  )

  const actions = (
    <div className={cn("flex gap-3", isMobile ? "flex-col" : "flex-col sm:flex-row")}>
      <Button
        type="submit"
        className={cn(isMobile ? "w-full" : "w-full sm:flex-1")}
        disabled={pending}
        size={isMobile ? "lg" : "default"}
      >
        {pending ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : isEditing ? (
          <PencilLineIcon data-icon="inline-start" />
        ) : (
          <CalendarClockIcon data-icon="inline-start" />
        )}
        {isEditing ? "Salvar alterações" : "Registrar mensalidade"}
      </Button>
      {isEditing ? (
        <Link
          href={returnTo}
          className={cn(
            buttonVariants({
              variant: "outline",
              size: isMobile ? "lg" : "default",
            }),
            isMobile ? "w-full" : "w-full sm:w-auto"
          )}
        >
          Cancelar edição
        </Link>
      ) : null}
    </div>
  )

  const form = (
    <form
      action={formAction}
      className={cn("flex flex-col", isMobile ? "min-h-0 flex-1" : "gap-5")}
    >
      <input
        type="hidden"
        name="monthlyExpenseId"
        value={initialValues.monthlyExpenseId ?? ""}
      />
      <input type="hidden" name="redirectTo" value={returnTo} />

      {isMobile ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
            <div className="space-y-4">
              {alertMessage}
              {fields}
            </div>
          </div>
          <DrawerFooter>{actions}</DrawerFooter>
        </>
      ) : (
        <>
          {alertMessage}
          {fields}
          {actions}
        </>
      )}
    </form>
  )

  if (isMobile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <DrawerHeader className="pr-14">
          <DrawerHeading>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeading>
          <div className="flex size-11 items-center justify-center rounded-md bg-muted text-primary">
            {isEditing ? (
              <PencilLineIcon aria-hidden="true" />
            ) : (
              <CalendarClockIcon aria-hidden="true" />
            )}
          </div>
        </DrawerHeader>
        {form}
      </div>
    )
  }

  return (
    <Card className="py-0">
      <CardHeader className="border-b py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-md bg-muted text-primary">
            {isEditing ? <PencilLineIcon /> : <CalendarClockIcon />}
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-5">{form}</CardContent>
    </Card>
  )
}
