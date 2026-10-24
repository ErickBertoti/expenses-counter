import { describe, expect, it, vi } from "vitest"

import { navigateExpenseComposer } from "./expense-composer-navigation"

function browserAt(href = "https://dashboard.local/?month=2026-10&view=monthly&card=c1") {
  return {
    location: { href },
    history: { pushState: vi.fn(), replaceState: vi.fn() },
  } as unknown as Window
}

describe("expense presentation navigation", () => {
  it.each(["compose=purchase", "compose=1", "compose=monthly", "edit=p1", "editMonthly=m1"])(
    "opens %s synchronously using native history and keeping filters", (query) => {
      const browser = browserAt()
      const href = `/?month=2026-10&view=monthly&card=c1&${query}`
      expect(navigateExpenseComposer(browser, href)).toBe(true)
      expect(browser.history.pushState).toHaveBeenCalledExactlyOnceWith(null, "", `https://dashboard.local${href}`)
      expect(browser.history.replaceState).not.toHaveBeenCalled()
    }
  )

  it("closes with replace, removing transient parameters while retaining the current dashboard", () => {
    const browser = browserAt("https://dashboard.local/?edit=p1&flash=ok&view=monthly&card=c1&month=2026-10")
    expect(navigateExpenseComposer(browser, "/?card=c1&month=2026-10&view=monthly", true)).toBe(true)
    expect(browser.history.replaceState).toHaveBeenCalledExactlyOnceWith(null, "", "https://dashboard.local/?card=c1&month=2026-10&view=monthly")
    expect(browser.history.pushState).not.toHaveBeenCalled()
  })

  it.each([
    "/?month=2026-11&view=monthly&card=c1&compose=purchase",
    "/?month=2026-10&view=purchases&card=c1&edit=p1",
    "/?month=2026-10&view=monthly&card=c2&compose=monthly",
    "/?month=2026-10&view=monthly&card=c1&q=abc&compose=purchase",
    "/auth/login", "https://other.local/?compose=purchase", "/?compose=purchase#other",
  ])("leaves a data-changing navigation to the router: %s", (href) => {
    const browser = browserAt()
    expect(navigateExpenseComposer(browser, href)).toBe(false)
    expect(browser.history.pushState).not.toHaveBeenCalled()
    expect(browser.history.replaceState).not.toHaveBeenCalled()
  })
})
