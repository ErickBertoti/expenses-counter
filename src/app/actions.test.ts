import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  refresh: vi.fn(),
  headers: vi.fn(),
  resolveAppOrigin: vi.fn(),
}))

vi.mock("@/lib/server", () => ({
  createClient: mocks.createClient,
}))

vi.mock("@/lib/app-origin", () => ({
  resolveAppOrigin: mocks.resolveAppOrigin,
}))

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
  refresh: mocks.refresh,
}))

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}))

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}))

import {
  saveMonthlyExpense,
  savePurchase,
  setMonthlyExpenseDisabled,
  setPurchaseDisabled,
} from "./actions"

type QueryResult = {
  data: unknown | null
  error: unknown | null
}

function createQueryBuilder(result: QueryResult) {
  const builder = {
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
  }

  return builder
}

function setupClient(
  table: "purchases" | "monthly_expenses",
  mutationResult: QueryResult
) {
  const cardQuery = createQueryBuilder({ data: { id: "card-1" }, error: null })
  const mutationQuery = createQueryBuilder(mutationResult)
  const from = vi.fn((requestedTable: string) => {
    if (requestedTable === "cards") {
      return cardQuery
    }

    if (requestedTable === table) {
      return mutationQuery
    }

    throw new Error(`Unexpected table: ${requestedTable}`)
  })
  const client = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } } })),
    },
    from,
  }

  mocks.createClient.mockResolvedValue(client)

  return { client, from, mutationQuery }
}

function createPurchaseForm(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const values = {
    purchaseId: "purchase-1",
    description: "Compra teste",
    purchaseDate: "2025-01-10",
    firstInstallmentMonth: "2025-01",
    installmentCount: "3",
    totalAmount: "100,00",
    cardId: "card-1",
    notes: "",
    redirectTo: "/?view=summary",
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => formData.set(key, value))
  return formData
}

function createMonthlyExpenseForm(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const values = {
    monthlyExpenseId: "monthly-1",
    description: "Academia",
    amount: "129,90",
    cardId: "card-1",
    startMonth: "2025-01",
    endMonth: "",
    notes: "",
    redirectTo: "/?view=monthly",
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => formData.set(key, value))
  return formData
}

describe("mutation safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.redirect.mockImplementation((path: string) => {
      throw new Error(`redirect:${path}`)
    })
  })

  it("returns a generic error when a purchase update affects no row", async () => {
    const { from, mutationQuery } = setupClient("purchases", {
      data: null,
      error: null,
    })

    const result = await savePurchase(undefined, createPurchaseForm())

    expect(result).toMatchObject({
      status: "error",
      message: "Nao foi possivel atualizar a compra agora.",
    })
    expect(from).toHaveBeenCalledWith("cards")
    expect(from).toHaveBeenCalledWith("purchases")
    expect(mutationQuery.select).toHaveBeenCalledWith("id")
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it("returns a generic error when a monthly expense update affects no row", async () => {
    const { from, mutationQuery } = setupClient("monthly_expenses", {
      data: null,
      error: null,
    })

    const result = await saveMonthlyExpense(
      undefined,
      createMonthlyExpenseForm()
    )

    expect(result).toMatchObject({
      status: "error",
      message: "Nao foi possivel atualizar a mensalidade agora.",
    })
    expect(from).toHaveBeenCalledWith("monthly_expenses")
    expect(mutationQuery.select).toHaveBeenCalledWith("id")
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it("throws the existing generic error when disabling a missing purchase", async () => {
    const { mutationQuery } = setupClient("purchases", {
      data: null,
      error: null,
    })

    await expect(setPurchaseDisabled("purchase-1", true)).rejects.toThrow(
      "Nao foi possivel desativar a compra."
    )
    expect(mutationQuery.select).toHaveBeenCalledWith("id")
  })

  it("throws the existing generic error when enabling a missing monthly expense", async () => {
    const { mutationQuery } = setupClient("monthly_expenses", {
      data: null,
      error: null,
    })

    await expect(
      setMonthlyExpenseDisabled("monthly-1", false)
    ).rejects.toThrow("Nao foi possivel ativar a mensalidade.")
    expect(mutationQuery.select).toHaveBeenCalledWith("id")
  })

  it("keeps the redirect after a purchase update succeeds", async () => {
    const { mutationQuery } = setupClient("purchases", {
      data: { id: "purchase-1" },
      error: null,
    })

    await expect(
      savePurchase(undefined, createPurchaseForm())
    ).rejects.toThrow("redirect:/?view=summary")
    expect(mutationQuery.select).toHaveBeenCalledWith("id")
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "page")
  })

  it("does not reach Supabase when a purchase date is impossible", async () => {
    const { from } = setupClient("purchases", {
      data: { id: "purchase-1" },
      error: null,
    })

    const result = await savePurchase(
      undefined,
      createPurchaseForm({ purchaseDate: "2025-02-31" })
    )

    expect(result).toMatchObject({ status: "error" })
    expect(from).not.toHaveBeenCalled()
  })

  it("does not reach Supabase when a purchase amount is malformed", async () => {
    const { from } = setupClient("purchases", {
      data: { id: "purchase-1" },
      error: null,
    })

    const result = await savePurchase(
      undefined,
      createPurchaseForm({ totalAmount: "1,2,3" })
    )

    expect(result).toMatchObject({ status: "error" })
    expect(from).not.toHaveBeenCalled()
  })

  it("does not reach Supabase when a monthly expense month is impossible", async () => {
    const { from } = setupClient("monthly_expenses", {
      data: { id: "monthly-1" },
      error: null,
    })

    const result = await saveMonthlyExpense(
      undefined,
      createMonthlyExpenseForm({ endMonth: "2025-13" })
    )

    expect(result).toMatchObject({ status: "error" })
    expect(from).not.toHaveBeenCalled()
  })
})
