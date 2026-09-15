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
  is_disabled: boolean
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

export type MonthlyExpenseRecord = {
  id: string
  user_id: string
  card_id: string
  description: string
  amount_cents: number
  start_month: string
  end_month: string | null
  notes: string | null
  is_disabled: boolean
  created_at: string
  updated_at: string
}

export type MonthlyExpenseFormValues = {
  monthlyExpenseId?: string
  description: string
  amount: string
  cardId: string
  startMonth: string
  endMonth: string
  notes: string
  redirectTo: string
}

export type ExpenseStatus = "active" | "completed" | "disabled"

export type PurchaseStatus = ExpenseStatus

export type DashboardView = "purchases" | "summary" | "monthly"

export type PurchaseWithProgress = PurchaseRecord & {
  card_name: string
  installment_amounts_cents: number[]
  paid_installments: number
  remaining_installments: number
  paid_amount_cents: number
  remaining_amount_cents: number
  completion_month: string
  status: ExpenseStatus
}

export type MonthlyExpenseWithCard = MonthlyExpenseRecord & {
  card_name: string
  status: ExpenseStatus
}

export type MonthlyLineItem = {
  id: string
  source_id: string
  source_type: "purchase" | "monthly_expense"
  month: string
  description: string
  card_id: string
  card_name: string
  amount_cents: number
  installment_index?: number
  installment_count?: number
}

export type MonthlyBreakdown = {
  month: string
  month_label: string
  total_amount_cents: number
  installment_total_cents: number
  monthly_total_cents: number
  item_count: number
  installment_count: number
  monthly_expense_count: number
  by_card: Array<{
    card_id: string
    card_name: string
    total_amount_cents: number
    item_count: number
  }>
  top_items: MonthlyLineItem[]
  line_items: MonthlyLineItem[]
}

export type MonthlySummary = {
  month: string
  month_label: string
  installment_total_cents: number
  monthly_total_cents: number
  total_amount_cents: number
  item_count: number
  purchase_count: number
  installment_count: number
  monthly_expense_count: number
}

export type MonthlyExportCardSummary = {
  card_id: string
  card_name: string
  total_amount_cents: number
  item_count: number
}

export type MonthlyExportPurchaseItem = {
  id: string
  description: string
  card_name: string
  installment_index: number
  installment_count: number
  installment_amount_cents: number
  total_amount_cents: number
  notes: string | null
}

export type MonthlyExportExpenseItem = {
  id: string
  description: string
  card_name: string
  amount_cents: number
  period_label: string
  notes: string | null
}

export type MonthlyExportModel = {
  month: string
  month_label: string
  scope_label: string
  includes_disabled: boolean
  total_amount_cents: number
  installment_total_cents: number
  monthly_total_cents: number
  item_count: number
  purchase_count: number
  installment_count: number
  monthly_expense_count: number
  by_card: MonthlyExportCardSummary[]
  purchases: MonthlyExportPurchaseItem[]
  monthly_expenses: MonthlyExportExpenseItem[]
}

export type DashboardFilters = {
  query: string
  status: "all" | ExpenseStatus
  includeDisabled: boolean
  month: string
  cardId: string
  view: DashboardView
  editId: string
  monthlyEditId: string
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

export type MonthlyExpenseFormField =
  | "description"
  | "amount"
  | "cardId"
  | "startMonth"
  | "endMonth"
  | "notes"

export type PurchaseFormState = {
  status: "idle" | "error"
  message?: string
  fieldErrors?: Partial<Record<PurchaseFormField, string>>
}

export type MonthlyExpenseFormState = {
  status: "idle" | "error"
  message?: string
  fieldErrors?: Partial<Record<MonthlyExpenseFormField, string>>
}

export type AuthFormField = "email" | "password"

export type AuthFormState = {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Partial<Record<AuthFormField, string>>
}
