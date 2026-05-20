"use client"

import Link from "next/link"
import {
  useActionState,
  useRef,
  useState,
  type FocusEvent,
  type RefObject,
} from "react"
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
  variant?: "desktop" | "mobile"
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-destructive">{message}</p>
}

function scrollFocusedFieldIntoView(
  event: FocusEvent<HTMLFormElement>,
  scrollContainerRef: RefObject<HTMLDivElement | null>
) {
  const field = event.target
  if (!(field instanceof HTMLElement)) {
    return
  }

  window.setTimeout(() => {
    field.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    })
  }, 180)

  const scrollContainer = scrollContainerRef.current
  if (!scrollContainer) {
    return
  }

  window.setTimeout(() => {
    const fieldRect = field.getBoundingClientRect()
    const containerRect = scrollContainer.getBoundingClientRect()
    const needsReveal =
      fieldRect.bottom > containerRect.bottom - 88 ||
      fieldRect.top < containerRect.top + 24

    if (needsReveal) {
      field.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      })
    }
  }, 260)
}

export function PurchaseForm({
  cards,
  idPrefix = "purchase-form",
  initialValues,
  isEditing,
  returnTo,
  variant = "desktop",
}: PurchaseFormProps) {
  const [state, formAction, pending] = useActionState(savePurchase, initialState)
  const [selectedCardId, setSelectedCardId] = useState(initialValues.cardId)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isMobile = variant === "mobile"
  const title = isEditing ? "Editar compra" : "Nova compra parcelada"
  const description = isMobile
    ? "Preencha os dados da compra e continue na mesma tela."
    : "Cadastre compras antigas ou atuais. O sistema calcula o andamento das parcelas com base no mês inicial informado."

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
            placeholder="Ex.: Notebook, curso, viagem"
            aria-invalid={Boolean(state.fieldErrors?.description) || undefined}
            autoCapitalize="sentences"
            autoComplete="off"
            enterKeyHint="next"
            required
          />
          {!isMobile ? (
            <FieldDescription>
              Use um nome curto para reconhecer a compra na lista.
            </FieldDescription>
          ) : null}
          <FieldError message={state.fieldErrors?.description} />
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
          {!isMobile ? (
            <FieldDescription>
              A estrutura já aceita mais de um cartão quando você quiser expandir.
            </FieldDescription>
          ) : null}
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
            defaultValue={initialValues.purchaseDate}
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
            defaultValue={initialValues.firstInstallmentMonth}
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
            defaultValue={String(initialValues.installmentCount)}
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
            defaultValue={initialValues.totalAmount}
            inputMode="decimal"
            placeholder="Ex.: 249,90"
            aria-invalid={Boolean(state.fieldErrors?.totalAmount) || undefined}
            autoComplete="off"
            enterKeyHint={isMobile ? "done" : "next"}
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
            defaultValue={initialValues.notes}
            placeholder="Opcional. Ex.: promoção, item compartilhado, lembrete."
            aria-invalid={Boolean(state.fieldErrors?.notes) || undefined}
            enterKeyHint="done"
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
      className={cn(
        "flex flex-col",
        isMobile ? "min-h-0 flex-1" : "gap-5"
      )}
      onFocusCapture={(event) => {
        if (isMobile) {
          scrollFocusedFieldIntoView(event, scrollContainerRef)
        }
      }}
    >
      <input type="hidden" name="purchaseId" value={initialValues.purchaseId ?? ""} />
      <input type="hidden" name="redirectTo" value={returnTo} />

      {isMobile ? (
        <>
          <div
            ref={scrollContainerRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]"
            style={{ scrollPaddingBottom: "9rem" }}
          >
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
            {isEditing ? <PencilLineIcon aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
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
            {isEditing ? <PencilLineIcon /> : <PlusIcon />}
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
