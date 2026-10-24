"use client"

import { useActionState } from "react"
import { PencilLineIcon, PlusIcon } from "lucide-react"

import { savePurchase } from "@/app/actions"
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
  PurchaseFormState,
  PurchaseFormValues,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const initialState: PurchaseFormState = {
  status: "idle",
}

type PurchaseFormProps = {
  cards: CardRecord[]
  idPrefix?: string
  initialValues: PurchaseFormValues
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

export function PurchaseForm({
  cards,
  idPrefix = "purchase-form",
  initialValues,
  isEditing,
  returnTo,
  onCancel,
  onStatusChange,
}: PurchaseFormProps) {
  const [state, formAction, pending] = useActionState(savePurchase, initialState)
  const form = useExpenseForm(initialValues, pending, state, onStatusChange)
  const { values, onFieldChange, setFieldValue } = form
  const title = isEditing ? "Editar compra" : "Nova compra parcelada"
  const description = "Cadastre compras antigas ou atuais. O andamento das parcelas é calculado pelo mês inicial."

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
            placeholder="Ex.: Notebook, curso, viagem"
            aria-invalid={Boolean(state.fieldErrors?.description) || undefined}
            autoCapitalize="sentences"
            autoComplete="off"
            enterKeyHint="next"
            required
          />
          <FieldDescription>
            Use um nome curto para reconhecer a compra na lista.
          </FieldDescription>
          <FieldError message={state.fieldErrors?.description} />
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
          <FieldDescription>
            A estrutura já aceita mais de um cartão quando você quiser expandir.
          </FieldDescription>
          <FieldError message={state.fieldErrors?.cardId} />
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.purchaseDate) || undefined}>
        <FieldLabel htmlFor={fieldId("purchaseDate")}>Data da compra</FieldLabel>
        <FieldContent>
          <Input
            id={fieldId("purchaseDate")}
            name="purchaseDate"
            type="date"
            value={values.purchaseDate}
            onChange={onFieldChange}
            aria-invalid={Boolean(state.fieldErrors?.purchaseDate) || undefined}
            enterKeyHint="next"
            required
          />
          <FieldError message={state.fieldErrors?.purchaseDate} />
        </FieldContent>
      </Field>

      <Field
        data-invalid={Boolean(state.fieldErrors?.firstInstallmentMonth) || undefined}
      >
        <FieldLabel htmlFor={fieldId("firstInstallmentMonth")}>
          Mês da 1ª parcela
        </FieldLabel>
        <FieldContent>
          <Input
            id={fieldId("firstInstallmentMonth")}
            name="firstInstallmentMonth"
            type="month"
            value={values.firstInstallmentMonth}
            onChange={onFieldChange}
            aria-invalid={
              Boolean(state.fieldErrors?.firstInstallmentMonth) || undefined
            }
            enterKeyHint="next"
            required
          />
          <FieldDescription>
            Esse campo decide em que mês a compra começa a pesar no total mensal.
          </FieldDescription>
          <FieldError message={state.fieldErrors?.firstInstallmentMonth} />
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.installmentCount) || undefined}>
        <FieldLabel htmlFor={fieldId("installmentCount")}>Número de parcelas</FieldLabel>
        <FieldContent>
          <Input
            id={fieldId("installmentCount")}
            name="installmentCount"
            type="number"
            min={1}
            max={120}
            value={values.installmentCount}
            onChange={onFieldChange}
            aria-invalid={Boolean(state.fieldErrors?.installmentCount) || undefined}
            enterKeyHint="next"
            inputMode="numeric"
            required
          />
          <FieldError message={state.fieldErrors?.installmentCount} />
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.totalAmount) || undefined}>
        <FieldLabel htmlFor={fieldId("totalAmount")}>Valor total</FieldLabel>
        <FieldContent>
          <Input
            id={fieldId("totalAmount")}
            name="totalAmount"
            value={values.totalAmount}
            onChange={onFieldChange}
            inputMode="decimal"
            placeholder="Ex.: 249,90"
            aria-invalid={Boolean(state.fieldErrors?.totalAmount) || undefined}
            autoComplete="off"
            enterKeyHint="next"
            spellCheck={false}
            required
          />
          <FieldDescription>
            Informe o total já com juros, se houver. Aceita vírgula ou ponto.
          </FieldDescription>
          <FieldError message={state.fieldErrors?.totalAmount} />
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(state.fieldErrors?.notes) || undefined}>
        <FieldLabel htmlFor={fieldId("notes")}>Observações</FieldLabel>
        <FieldContent>
          <Textarea
            id={fieldId("notes")}
            name="notes"
            value={values.notes}
            onChange={onFieldChange}
            placeholder="Opcional. Ex.: promoção, item compartilhado, lembrete."
            aria-invalid={Boolean(state.fieldErrors?.notes) || undefined}
            enterKeyHint="done"
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
      icon={isEditing ? <PencilLineIcon aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
      submitLabel={isEditing ? "Salvar alterações" : "Registrar compra"}
      pending={pending}
      onCancel={onCancel}
      onStatusChange={onStatusChange}
      alert={alertMessage}
      hiddenFields={
        <>
          <input type="hidden" name="purchaseId" value={initialValues.purchaseId ?? ""} />
          <input type="hidden" name="redirectTo" value={returnTo} />
        </>
      }
    >
      {fields}
    </ExpenseFormLayout>
  )
}
