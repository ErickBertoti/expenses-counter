import { describe, expect, it } from "vitest"

import { resolveDashboardHref, resolveDashboardMonthHref } from "./dashboard-url"

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
