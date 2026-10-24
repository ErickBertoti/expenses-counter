"use client"

import { useActionState } from "react"
import { CalendarClockIcon, PencilLineIcon } from "lucide-react"

import { saveMonthlyExpense } from "@/app/actions"
import {
  ExpenseFormLayout,
  useExpenseForm,
  type ExpenseFormStatus,
} from "@/components/dashboard/expense-form-layout"
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
  onCancel: () => void
  onStatusChange: (status: ExpenseFormStatus) => void
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
  onCancel,
  onStatusChange,
}: MonthlyExpenseFormProps) {
  const [state, formAction, pending] = useActionState(
    saveMonthlyExpense,
    initialState
  )
  const form = useExpenseForm(initialValues, pending, state, onStatusChange)
  const { values, onFieldChange, setFieldValue } = form
  const title = isEditing ? "Editar mensalidade" : "Nova mensalidade"
  const description = "Registre academia, assinatura, plano ou outro custo que se repete mês a mês."

  function fieldId(name: string) {
    return `${idPrefix}-${name}`
  }

  const alertMessage = state.message ? (
    <div
      role="alert"
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
    <FieldGroup className="gap-4 lg:gap-5">
      <Field data-invalid={Boolean(state.fieldErrors?.description) || undefined}>
        <FieldLabel htmlFor={fieldId("description")}>Descrição</FieldLabel>
        <FieldContent>
          <Input
            id={fieldId("description")}
            name="description"
            value={values.description}
            onChange={onFieldChange}
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
            value={values.amount}
            onChange={onFieldChange}
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
            value={values.cardId}
            onValueChange={(value) => setFieldValue("cardId", value ?? "")}
          >
            <SelectTrigger
              className="w-full"
              aria-invalid={Boolean(state.fieldErrors?.cardId) || undefined}
            >
              <SelectValue placeholder="Selecione um cartão">
                {cards.find((card) => card.id === values.cardId)?.name}
              </SelectValue>
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
              value={values.startMonth}
              onChange={onFieldChange}
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
              value={values.endMonth}
              onChange={onFieldChange}
              aria-invalid={Boolean(state.fieldErrors?.endMonth) || undefined}
            />
            <FieldDescription>Deixe vazio para repetir sem prazo.</FieldDescription>
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
            value={values.notes}
            onChange={onFieldChange}
            placeholder="Opcional. Ex.: vence no dia 10, reajuste anual."
            aria-invalid={Boolean(state.fieldErrors?.notes) || undefined}
            rows={3}
          />
          <FieldError message={state.fieldErrors?.notes} />
        </FieldContent>
      </Field>
    </FieldGroup>
  )

  return (
    <ExpenseFormLayout
      form={form}
      action={formAction}
      title={title}
      description={description}
      icon={isEditing ? <PencilLineIcon aria-hidden="true" /> : <CalendarClockIcon aria-hidden="true" />}
      submitLabel={isEditing ? "Salvar alterações" : "Registrar mensalidade"}
      pending={pending}
      onCancel={onCancel}
      onStatusChange={onStatusChange}
      alert={alertMessage}
      hiddenFields={
        <>
          <input type="hidden" name="monthlyExpenseId" value={initialValues.monthlyExpenseId ?? ""} />
          <input type="hidden" name="redirectTo" value={returnTo} />
        </>
      }
    >
      {fields}
    </ExpenseFormLayout>
  )
}
