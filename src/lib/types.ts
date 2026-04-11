export type CardRecord = {
  id: string
  user_id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type PurchaseRecord = {
  id: string
  user_id: string
  card_id: string
  description: string
  purchase_date: string
  first_installment_month: string
  installment_count: number
  total_amount_cents: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type PurchaseFormValues = {
  purchaseId?: string
  description: string
  purchaseDate: string
  firstInstallmentMonth: string
  installmentCount: number
  totalAmount: string
  cardId: string
  notes: string
  redirectTo: string
}

export type PurchaseStatus = "active" | "completed"

export type PurchaseWithProgress = PurchaseRecord & {
  card_name: string
  installment_amounts_cents: number[]
  paid_installments: number
  remaining_installments: number
  paid_amount_cents: number
  remaining_amount_cents: number
  completion_month: string
  status: PurchaseStatus
}

export type MonthlySummary = {
  month: string
  month_label: string
  total_amount_cents: number
  purchase_count: number
  installment_count: number
}

export type DashboardFilters = {
  query: string
  status: "all" | PurchaseStatus
  month: string
  cardId: string
  editId: string
  flash: string
}

export type PurchaseFormField =
  | "description"
  | "purchaseDate"
  | "firstInstallmentMonth"
  | "installmentCount"
  | "totalAmount"
  | "cardId"
  | "notes"

export type PurchaseFormState = {
  status: "idle" | "error"
  message?: string
  fieldErrors?: Partial<Record<PurchaseFormField, string>>
}

export type AuthFormState = {
  status: "idle" | "error" | "success"
  message?: string
}
