import { describe, expect, it } from "vitest"

import { resolveDashboardHref, resolveDashboardMonthHref, resolveExpenseComposerMode } from "./dashboard-url"

describe("resolveExpenseComposerMode", () => {
  it.each(["1", "purchase"])("keeps the purchase compose alias %s", (compose) => {
    expect(resolveExpenseComposerMode(`compose=${compose}`)).toEqual({
      kind: "purchase", isEditing: false, key: "purchase:new",
    })
  })

  it("opens a new monthly expense without changing the selected dashboard view", () => {
    expect(resolveExpenseComposerMode("view=summary&month=2026-10&compose=monthly")).toEqual({
      kind: "monthly", isEditing: false, key: "monthly:new",
    })
  })

  it("prefers a valid edit over a conflicting compose request", () => {
    expect(resolveExpenseComposerMode("edit=p1&compose=monthly", "p1")).toEqual({
      kind: "purchase", isEditing: true, key: "purchase:p1",
    })
  })

  it("normalizes edit IDs like the server filter parser before choosing create mode", () => {
    expect(resolveExpenseComposerMode("edit=%20p1%20&compose=purchase", "p1")?.isEditing).toBe(true)
    expect(resolveExpenseComposerMode("editMonthly=%20m1%20&compose=monthly", undefined, "m1")?.isEditing).toBe(true)
  })

  it("resolves conflicting valid edits to one purchase form", () => {
    expect(resolveExpenseComposerMode("edit=p1&editMonthly=m1", "p1", "m1")?.key).toBe("purchase:p1")
  })

  it("opens a valid monthly edit when the purchase ID is invalid", () => {
    expect(resolveExpenseComposerMode("edit=missing&editMonthly=m1", undefined, "m1")).toEqual({
      kind: "monthly", isEditing: true, key: "monthly:m1",
    })
  })

  it.each(["", "compose=unknown", "edit=missing", "editMonthly=missing"])(
    "does not open an empty edit or unknown compose request: %s",
    (query) => expect(resolveExpenseComposerMode(query)).toBeNull()
  )
})

describe("resolveDashboardHref", () => {
  it("preserves filters while changing the focus month", () => {
    expect(
      resolveDashboardHref(
        "/",
        "q=curso&status=active&card=card-1&includeDisabled=1&view=summary",
        { month: "2026-05" }
      )
    ).toBe(
      "/?q=curso&status=active&card=card-1&includeDisabled=1&view=summary&month=2026-05"
    )
  })

  it("clears transient state", () => {
    expect(
      resolveDashboardHref(
        "/",
        "month=2026-02&edit=1&editMonthly=2&flash=ok&compose=purchase",
        { month: "2026-03" }
      )
    ).toBe("/?month=2026-03")
  })

  it("uses the same canonical month selection for summary links", () => {
    expect(
      resolveDashboardMonthHref(
        "/?q=curso&status=active&card=card-1&includeDisabled=1&view=summary&month=2026-02",
        "2026-05"
      )
    ).toBe(
      "/?q=curso&status=active&card=card-1&includeDisabled=1&view=summary&month=2026-05"
    )
  })

  it("clears transient state when a summary link changes month", () => {
    expect(
      resolveDashboardMonthHref(
        "/?q=curso&view=summary&edit=1&editMonthly=2&flash=ok&compose=monthly",
        "2026-05"
      )
    ).toBe("/?q=curso&view=summary&month=2026-05")
  })
})
