import { describe, expect, it } from "vitest"

import { resolveDashboardHref } from "./dashboard-url"

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
})
