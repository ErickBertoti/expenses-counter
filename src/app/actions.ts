"use server"

import { revalidatePath, refresh } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { createClient } from "@/lib/server"
import { resolveAppOrigin } from "@/lib/app-origin"
import {
  monthKeyFromDate,
  parseCurrencyInputToCents,
  sanitizeRedirectPath,
} from "@/lib/purchases"
import type {
  AuthFormState,
  PurchaseFormField,
  PurchaseFormState,
} from "@/lib/types"

const INITIAL_PURCHASE_FORM_STATE: PurchaseFormState = {
  status: "idle",
}

const INITIAL_AUTH_FORM_STATE: AuthFormState = {
  status: "idle",
}

const purchaseFormSchema = z
  .object({
    purchaseId: z.string().trim().optional(),
    description: z
      .string()
      .trim()
      .min(1, "Informe uma descrição.")
      .max(160, "Use até 160 caracteres."),
    purchaseDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data de compra válida."),
    firstInstallmentMonth: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Informe o mês inicial da primeira parcela."),
    installmentCount: z.coerce
      .number()
      .int("Use um número inteiro de parcelas.")
      .min(1, "O número de parcelas deve ser maior que zero.")
      .max(120, "Use no máximo 120 parcelas."),
    totalAmount: z.string().transform((value, context) => {
      const cents = parseCurrencyInputToCents(value)

      if (cents === null || cents <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um valor total válido.",
        })
        return z.NEVER
      }

      return cents
    }),
    cardId: z.string().trim().min(1, "Selecione um cartão."),
    notes: z
      .string()
      .trim()
      .max(500, "Use até 500 caracteres nas observações.")
      .optional()
      .default(""),
    redirectTo: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.firstInstallmentMonth < monthKeyFromDate(value.purchaseDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstInstallmentMonth"],
        message: "O mês da primeira parcela não pode ser anterior ao mês da compra.",
      })
    }
  })

function mapZodIssuesToFieldErrors(error: z.ZodError) {
  const fieldErrors: Partial<Record<PurchaseFormField, string>> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as PurchaseFormField] = issue.message
    }
  }

  return fieldErrors
}

async function getAppOrigin() {
  const headerStore = await headers()
  return resolveAppOrigin({
    forwardedHost: headerStore.get("x-forwarded-host"),
    forwardedProto: headerStore.get("x-forwarded-proto"),
    host: headerStore.get("host"),
  })
}

export async function requestMagicLink(
  previousState: AuthFormState = INITIAL_AUTH_FORM_STATE,
  formData: FormData
): Promise<AuthFormState> {
  void previousState
  const email = z.string().email("Digite um email válido.").safeParse(formData.get("email"))

  if (!email.success) {
    return {
      status: "error",
      message: email.error.issues[0]?.message ?? "Digite um email válido.",
    }
  }

  const supabase = await createClient()
  const appOrigin = await getAppOrigin()
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: `${appOrigin}/auth/callback`,
    },
  })

  if (error) {
    return {
      status: "error",
      message: "Não foi possível enviar o link agora. Confira o email e tente novamente.",
    }
  }

  return {
    status: "success",
    message: "Link enviado. Abra o email e volte para concluir o login.",
  }
}

export async function savePurchase(
  previousState: PurchaseFormState = INITIAL_PURCHASE_FORM_STATE,
  formData: FormData
): Promise<PurchaseFormState> {
  void previousState
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      status: "error",
      message: "Sua sessão expirou. Entre novamente.",
    }
  }

  const parsed = purchaseFormSchema.safeParse({
    purchaseId: formData.get("purchaseId")?.toString(),
    description: formData.get("description")?.toString(),
    purchaseDate: formData.get("purchaseDate")?.toString(),
    firstInstallmentMonth: formData.get("firstInstallmentMonth")?.toString(),
    installmentCount: formData.get("installmentCount")?.toString(),
    totalAmount: formData.get("totalAmount")?.toString(),
    cardId: formData.get("cardId")?.toString(),
    notes: formData.get("notes")?.toString(),
    redirectTo: formData.get("redirectTo")?.toString(),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados antes de salvar.",
      fieldErrors: mapZodIssuesToFieldErrors(parsed.error),
    }
  }

  const { purchaseId, redirectTo, ...purchase } = parsed.data

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id")
    .eq("id", purchase.cardId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (cardError || !card) {
    return {
      status: "error",
      message: "Selecione um cartão válido.",
      fieldErrors: {
        cardId: "Selecione um cartão válido.",
      },
    }
  }

  const payload = {
    card_id: purchase.cardId,
    description: purchase.description,
    purchase_date: purchase.purchaseDate,
    first_installment_month: `${purchase.firstInstallmentMonth}-01`,
    installment_count: purchase.installmentCount,
    total_amount_cents: purchase.totalAmount,
    notes: purchase.notes || null,
  }

  if (purchaseId) {
    const { error } = await supabase
      .from("purchases")
      .update(payload)
      .eq("id", purchaseId)
      .eq("user_id", user.id)

    if (error) {
      return {
        status: "error",
        message: "Não foi possível atualizar a compra agora.",
      }
    }
  } else {
    const { error } = await supabase.from("purchases").insert({
      ...payload,
      user_id: user.id,
    })

    if (error) {
      return {
        status: "error",
        message: "Não foi possível registrar a compra agora.",
      }
    }
  }

  revalidatePath("/", "page")
  redirect(sanitizeRedirectPath(redirectTo))
}

export async function deletePurchase(purchaseId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Sua sessão expirou.")
  }

  const { error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", purchaseId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error("Não foi possível excluir a compra.")
  }

  revalidatePath("/", "page")
  refresh()
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
