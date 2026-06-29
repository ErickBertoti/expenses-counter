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
  AuthFormField,
  AuthFormState,
  MonthlyExpenseFormField,
  MonthlyExpenseFormState,
  PurchaseFormField,
  PurchaseFormState,
} from "@/lib/types"

const INITIAL_PURCHASE_FORM_STATE: PurchaseFormState = {
  status: "idle",
}

const INITIAL_AUTH_FORM_STATE: AuthFormState = {
  status: "idle",
}

const INITIAL_MONTHLY_EXPENSE_FORM_STATE: MonthlyExpenseFormState = {
  status: "idle",
}

const signInFormSchema = z.object({
  email: z.string().trim().email("Digite um email valido."),
  password: z
    .string()
    .min(1, "Digite sua senha.")
    .min(8, "A senha deve ter pelo menos 8 caracteres."),
})

const passwordResetFormSchema = z.object({
  email: z.string().trim().email("Digite um email valido."),
})

const purchaseFormSchema = z
  .object({
    purchaseId: z.string().trim().optional(),
    description: z
      .string()
      .trim()
      .min(1, "Informe uma descricao.")
      .max(160, "Use ate 160 caracteres."),
    purchaseDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data de compra valida."),
    firstInstallmentMonth: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Informe o mes inicial da primeira parcela."),
    installmentCount: z.coerce
      .number()
      .int("Use um numero inteiro de parcelas.")
      .min(1, "O numero de parcelas deve ser maior que zero.")
      .max(120, "Use no maximo 120 parcelas."),
    totalAmount: z.string().transform((value, context) => {
      const cents = parseCurrencyInputToCents(value)

      if (cents === null || cents <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um valor total valido.",
        })
        return z.NEVER
      }

      return cents
    }),
    cardId: z.string().trim().min(1, "Selecione um cartao."),
    notes: z
      .string()
      .trim()
      .max(500, "Use ate 500 caracteres nas observacoes.")
      .optional()
      .default(""),
    redirectTo: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.firstInstallmentMonth < monthKeyFromDate(value.purchaseDate)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["firstInstallmentMonth"],
        message: "O mes da primeira parcela nao pode ser anterior ao mes da compra.",
      })
    }
  })

const monthlyExpenseFormSchema = z
  .object({
    monthlyExpenseId: z.string().trim().optional(),
    description: z
      .string()
      .trim()
      .min(1, "Informe uma descricao.")
      .max(160, "Use ate 160 caracteres."),
    amount: z.string().transform((value, context) => {
      const cents = parseCurrencyInputToCents(value)

      if (cents === null || cents <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um valor mensal valido.",
        })
        return z.NEVER
      }

      return cents
    }),
    cardId: z.string().trim().min(1, "Selecione um cartao."),
    startMonth: z
      .string()
      .regex(/^\d{4}-\d{2}$/, "Informe o mes inicial."),
    endMonth: z.string().trim().optional().default(""),
    notes: z
      .string()
      .trim()
      .max(500, "Use ate 500 caracteres nas observacoes.")
      .optional()
      .default(""),
    redirectTo: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.endMonth && !/^\d{4}-\d{2}$/.test(value.endMonth)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endMonth"],
        message: "Informe um mes final valido.",
      })
      return
    }

    if (value.endMonth && value.endMonth < value.startMonth) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endMonth"],
        message: "O mes final nao pode ser anterior ao mes inicial.",
      })
    }
  })

function mapZodIssuesToPurchaseFieldErrors(error: z.ZodError) {
  const fieldErrors: Partial<Record<PurchaseFormField, string>> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as PurchaseFormField] = issue.message
    }
  }

  return fieldErrors
}

function mapZodIssuesToMonthlyExpenseFieldErrors(error: z.ZodError) {
  const fieldErrors: Partial<Record<MonthlyExpenseFormField, string>> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as MonthlyExpenseFormField] = issue.message
    }
  }

  return fieldErrors
}

function mapZodIssuesToAuthFieldErrors(error: z.ZodError) {
  const fieldErrors: Partial<Record<AuthFormField, string>> = {}

  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === "string" && !(field in fieldErrors)) {
      fieldErrors[field as AuthFormField] = issue.message
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

export async function signInWithPasswordAction(
  previousState: AuthFormState = INITIAL_AUTH_FORM_STATE,
  formData: FormData
): Promise<AuthFormState> {
  void previousState
  const parsed = signInFormSchema.safeParse({
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados de acesso.",
      fieldErrors: mapZodIssuesToAuthFieldErrors(parsed.error),
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      status: "error",
      message: "Email ou senha invalidos.",
    }
  }

  redirect("/")
}

export async function requestPasswordResetAction(
  previousState: AuthFormState = INITIAL_AUTH_FORM_STATE,
  formData: FormData
): Promise<AuthFormState> {
  void previousState
  const parsed = passwordResetFormSchema.safeParse({
    email: formData.get("email")?.toString(),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe um email valido para receber o link.",
      fieldErrors: mapZodIssuesToAuthFieldErrors(parsed.error),
    }
  }

  const supabase = await createClient()
  const appOrigin = await getAppOrigin()
  const redirectTo = `${appOrigin}/auth/callback?next=/auth/update-password`

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  })

  if (error) {
    console.error("[auth] Password reset request failed", {
      message: error.message,
      status: error.status,
      code: error.code,
      redirectTo,
    })
  }

  return {
    status: "success",
    message:
      "Se o email estiver cadastrado, voce recebera um link para criar ou redefinir sua senha.",
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
      message: "Sua sessao expirou. Entre novamente.",
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
      fieldErrors: mapZodIssuesToPurchaseFieldErrors(parsed.error),
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
      message: "Selecione um cartao valido.",
      fieldErrors: {
        cardId: "Selecione um cartao valido.",
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
        message: "Nao foi possivel atualizar a compra agora.",
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
        message: "Nao foi possivel registrar a compra agora.",
      }
    }
  }

  revalidatePath("/", "page")
  redirect(sanitizeRedirectPath(redirectTo))
}

export async function saveMonthlyExpense(
  previousState: MonthlyExpenseFormState = INITIAL_MONTHLY_EXPENSE_FORM_STATE,
  formData: FormData
): Promise<MonthlyExpenseFormState> {
  void previousState
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      status: "error",
      message: "Sua sessao expirou. Entre novamente.",
    }
  }

  const parsed = monthlyExpenseFormSchema.safeParse({
    monthlyExpenseId: formData.get("monthlyExpenseId")?.toString(),
    description: formData.get("description")?.toString(),
    amount: formData.get("amount")?.toString(),
    cardId: formData.get("cardId")?.toString(),
    startMonth: formData.get("startMonth")?.toString(),
    endMonth: formData.get("endMonth")?.toString(),
    notes: formData.get("notes")?.toString(),
    redirectTo: formData.get("redirectTo")?.toString(),
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados antes de salvar.",
      fieldErrors: mapZodIssuesToMonthlyExpenseFieldErrors(parsed.error),
    }
  }

  const { monthlyExpenseId, redirectTo, ...monthlyExpense } = parsed.data

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id")
    .eq("id", monthlyExpense.cardId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (cardError || !card) {
    return {
      status: "error",
      message: "Selecione um cartao valido.",
      fieldErrors: {
        cardId: "Selecione um cartao valido.",
      },
    }
  }

  const payload = {
    card_id: monthlyExpense.cardId,
    description: monthlyExpense.description,
    amount_cents: monthlyExpense.amount,
    start_month: `${monthlyExpense.startMonth}-01`,
    end_month: monthlyExpense.endMonth ? `${monthlyExpense.endMonth}-01` : null,
    notes: monthlyExpense.notes || null,
  }

  if (monthlyExpenseId) {
    const { error } = await supabase
      .from("monthly_expenses")
      .update(payload)
      .eq("id", monthlyExpenseId)
      .eq("user_id", user.id)

    if (error) {
      return {
        status: "error",
        message: "Nao foi possivel atualizar a mensalidade agora.",
      }
    }
  } else {
    const { error } = await supabase.from("monthly_expenses").insert({
      ...payload,
      user_id: user.id,
    })

    if (error) {
      return {
        status: "error",
        message: "Nao foi possivel registrar a mensalidade agora.",
      }
    }
  }

  revalidatePath("/", "page")
  redirect(sanitizeRedirectPath(redirectTo))
}

export async function setPurchaseDisabled(purchaseId: string, disabled: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Sua sessao expirou.")
  }

  const { error } = await supabase
    .from("purchases")
    .update({
      is_disabled: disabled,
    })
    .eq("id", purchaseId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(
      disabled
        ? "Nao foi possivel desativar a compra."
        : "Nao foi possivel ativar a compra."
    )
  }

  revalidatePath("/", "page")
  refresh()
}

export async function setMonthlyExpenseDisabled(
  monthlyExpenseId: string,
  disabled: boolean
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Sua sessao expirou.")
  }

  const { error } = await supabase
    .from("monthly_expenses")
    .update({
      is_disabled: disabled,
    })
    .eq("id", monthlyExpenseId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(
      disabled
        ? "Nao foi possivel desativar a mensalidade."
        : "Nao foi possivel ativar a mensalidade."
    )
  }

  revalidatePath("/", "page")
  refresh()
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
