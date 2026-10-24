import type { MouseEvent } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ExpenseComposerLink } from "./expense-composer-link"

function setup(props: Partial<Parameters<typeof ExpenseComposerLink>[0]> = {}) {
  const pushState = vi.fn()
  vi.stubGlobal("window", {
    location: { href: "https://dashboard.local/?view=monthly" },
    history: { pushState },
  })
  const anchor = ExpenseComposerLink({ href: "/?view=monthly&compose=purchase", ...props })
  const event = {
    button: 0, defaultPrevented: false, metaKey: false, ctrlKey: false,
    shiftKey: false, altKey: false,
    preventDefault: vi.fn(),
  }
  return {
    anchor, event, pushState,
    click(overrides = {}) {
      anchor.props.onClick({ ...event, ...overrides } as unknown as MouseEvent<HTMLAnchorElement>)
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe("expense composer entry links", () => {
  it("intercepts a normal click synchronously and keeps the navigable href", () => {
    const test = setup()
    test.click()
    expect(test.anchor.props.href).toBe("/?view=monthly&compose=purchase")
    expect(test.pushState).toHaveBeenCalledExactlyOnceWith(null, "", "https://dashboard.local/?view=monthly&compose=purchase")
    expect(test.event.preventDefault).toHaveBeenCalledOnce()
  })

  it.each([
    { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true },
    { button: 1 }, { defaultPrevented: true },
  ])("preserves native modified clicks: %j", (event) => {
    const test = setup()
    test.click(event)
    expect(test.pushState).not.toHaveBeenCalled()
    expect(test.event.preventDefault).not.toHaveBeenCalled()
  })

  it.each([{ target: "_blank" }, { download: "export" }, { href: "/?view=purchases&compose=purchase" }])(
    "preserves the browser fallback when necessary: %j", (props) => {
      const test = setup(props)
      test.click()
      expect(test.pushState).not.toHaveBeenCalled()
      expect(test.event.preventDefault).not.toHaveBeenCalled()
    }
  )
})
