"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { Loader2Icon, PencilLineIcon, PlusIcon } from "lucide-react"

import { savePurchase } from "@/app/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  initialValues: PurchaseFormValues
  isEditing: boolean
  returnTo: string
}

export function PurchaseForm({
  cards,
  initialValues,
  isEditing,
  returnTo,
}: PurchaseFormProps) {
  const [state, formAction, pending] = useActionState(savePurchase, initialState)
  const [selectedCardId, setSelectedCardId] = useState(initialValues.cardId)

  return (
    <Card className="rounded-[30px] border border-border/70 bg-background/95 py-0 shadow-sm">
      <CardHeader className="border-b py-5">
        <div className="flex items-start gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isEditing ? <PencilLineIcon /> : <PlusIcon />}
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>
              {isEditing ? "Editar compra" : "Nova compra parcelada"}
            </CardTitle>
            <CardDescription>
              Cadastre compras antigas ou atuais. O sistema calcula o andamento
              das parcelas com base no mês inicial informado.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-5">
        <form action={formAction} className="flex flex-col gap-5">
          <input type="hidden" name="purchaseId" value={initialValues.purchaseId ?? ""} />
          <input type="hidden" name="redirectTo" value={returnTo} />

          {state.message ? (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.message}
            </div>
          ) : null}

          <FieldGroup>
            <Field data-invalid={Boolean(state.fieldErrors?.description) || undefined}>
              <FieldLabel htmlFor="description">Descrição</FieldLabel>
              <FieldContent>
                <Input
                  id="description"
                  name="description"
                  defaultValue={initialValues.description}
                  placeholder="Ex.: Notebook, curso, viagem"
                  aria-invalid={Boolean(state.fieldErrors?.description) || undefined}
                  required
                />
                <FieldDescription>
                  Use um nome curto para reconhecer a compra na lista.
                </FieldDescription>
                {state.fieldErrors?.description ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.description}
                  </p>
                ) : null}
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(state.fieldErrors?.cardId) || undefined}>
              <FieldLabel htmlFor="cardId">Cartão</FieldLabel>
              <FieldContent>
                <Select
                  id="cardId"
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
                <FieldDescription>
                  A estrutura já aceita mais de um cartão quando você quiser
                  expandir.
                </FieldDescription>
                {state.fieldErrors?.cardId ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.cardId}
                  </p>
                ) : null}
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(state.fieldErrors?.purchaseDate) || undefined}>
              <FieldLabel htmlFor="purchaseDate">Data da compra</FieldLabel>
              <FieldContent>
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  defaultValue={initialValues.purchaseDate}
                  aria-invalid={Boolean(state.fieldErrors?.purchaseDate) || undefined}
                  required
                />
                {state.fieldErrors?.purchaseDate ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.purchaseDate}
                  </p>
                ) : null}
              </FieldContent>
            </Field>

            <Field
              data-invalid={Boolean(state.fieldErrors?.firstInstallmentMonth) || undefined}
            >
              <FieldLabel htmlFor="firstInstallmentMonth">
                Mês da 1ª parcela
              </FieldLabel>
              <FieldContent>
                <Input
                  id="firstInstallmentMonth"
                  name="firstInstallmentMonth"
                  type="month"
                  defaultValue={initialValues.firstInstallmentMonth}
                  aria-invalid={
                    Boolean(state.fieldErrors?.firstInstallmentMonth) || undefined
                  }
                  required
                />
                <FieldDescription>
                  Esse campo decide em que mês a compra começa a pesar no total
                  mensal.
                </FieldDescription>
                {state.fieldErrors?.firstInstallmentMonth ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.firstInstallmentMonth}
                  </p>
                ) : null}
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(state.fieldErrors?.installmentCount) || undefined}>
              <FieldLabel htmlFor="installmentCount">Número de parcelas</FieldLabel>
              <FieldContent>
                <Input
                  id="installmentCount"
                  name="installmentCount"
                  type="number"
                  min={1}
                  max={120}
                  defaultValue={String(initialValues.installmentCount)}
                  aria-invalid={
                    Boolean(state.fieldErrors?.installmentCount) || undefined
                  }
                  required
                />
                {state.fieldErrors?.installmentCount ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.installmentCount}
                  </p>
                ) : null}
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(state.fieldErrors?.totalAmount) || undefined}>
              <FieldLabel htmlFor="totalAmount">Valor total</FieldLabel>
              <FieldContent>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  defaultValue={initialValues.totalAmount}
                  inputMode="decimal"
                  placeholder="Ex.: 249,90"
                  aria-invalid={Boolean(state.fieldErrors?.totalAmount) || undefined}
                  required
                />
                <FieldDescription>
                  Informe o total já com juros, se houver. Aceita vírgula ou
                  ponto.
                </FieldDescription>
                {state.fieldErrors?.totalAmount ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.totalAmount}
                  </p>
                ) : null}
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(state.fieldErrors?.notes) || undefined}>
              <FieldLabel htmlFor="notes">Observações</FieldLabel>
              <FieldContent>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={initialValues.notes}
                  placeholder="Opcional. Ex.: promoção, item compartilhado, lembrete."
                  aria-invalid={Boolean(state.fieldErrors?.notes) || undefined}
                  rows={4}
                />
                {state.fieldErrors?.notes ? (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.notes}
                  </p>
                ) : null}
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              className="w-full sm:flex-1"
              disabled={pending}
            >
              {pending ? (
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
              ) : isEditing ? (
                <PencilLineIcon data-icon="inline-start" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              {isEditing ? "Salvar alterações" : "Registrar compra"}
            </Button>
            {isEditing ? (
              <Link
                href={returnTo}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "w-full sm:w-auto"
                )}
              >
                Cancelar edição
              </Link>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
