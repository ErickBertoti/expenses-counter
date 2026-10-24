import { describe, expect, it, vi } from "vitest"

import { installExpenseNavigationGuard } from "./expense-navigation-guard"

// A queued History implementation: traversal changes the address before the
// router's popstate listener runs, just as in the browser.
function createBrowser() {
  const events = new EventTarget()
  const entries = [{ href: "https://dashboard.local/", state: { __NA: true, tree: "base" } as unknown }]
  const tasks: Array<() => void> = []
  let index = 0
  const history = {
    get state() { return entries[index].state },
    get length() { return entries.length },
    pushState(state: unknown, unused: string, url?: string | URL | null) {
      entries.splice(index + 1)
      entries.push({ href: new URL(url?.toString() ?? entries[index].href, entries[index].href).href, state })
      index += 1
    },
    replaceState(state: unknown, unused: string, url?: string | URL | null) {
      entries[index] = { href: new URL(url?.toString() ?? entries[index].href, entries[index].href).href, state }
    },
    go(delta: number) {
      tasks.push(() => {
        const next = index + delta
        if (next < 0 || next >= entries.length) return
        index = next
        const event = new Event("popstate")
        Object.defineProperty(event, "state", { value: entries[index].state })
        events.dispatchEvent(event)
      })
    },
  }
  const browser = {
    history,
    location: { get href() { return entries[index].href } },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
  } as unknown as Window

  return {
    browser,
    entries,
    flush() {
      while (tasks.length) tasks.shift()!()
    },
    listenToRouter(listener: () => void) {
      events.addEventListener("popstate", listener)
    },
  }
}

function setup() {
  const test = createBrowser()
  let blocked = false
  const onBlocked = vi.fn()
  const navigate = vi.fn()
  const router = vi.fn()
  const originalPush = test.browser.history.pushState
  const originalReplace = test.browser.history.replaceState
  const guard = installExpenseNavigationGuard(test.browser, {
    isBlocked: () => blocked, onBlocked, navigate,
  })
  guard.trackHistory()
  test.listenToRouter(router)
  return { ...test, guard, onBlocked, navigate, router, originalPush, originalReplace, block: () => { blocked = true } }
}

describe("expense history protection", () => {
  it("restores Back before the router can unmount a dirty form, and cancellation preserves history", () => {
    const test = setup()
    test.browser.history.pushState({ __NA: true, tree: "purchase" }, "", "/?compose=purchase")
    test.block()
    const length = test.browser.history.length
    test.browser.history.go(-1)
    test.flush()
    expect(test.browser.location.href).toBe("https://dashboard.local/?compose=purchase")
    expect(test.router).not.toHaveBeenCalled()
    expect(test.onBlocked).toHaveBeenCalledOnce()
    expect(test.browser.history.length).toBe(length)
    test.guard.cancel()
    expect(test.guard.proceed()).toBe(false)
    expect(test.browser.history.state).toMatchObject({ __NA: true, tree: "purchase" })
  })

  it("replays an approved Back exactly once without replacing the destination or deleting Forward", () => {
    const test = setup()
    test.browser.history.pushState({ __NA: true, tree: "monthly" }, "", "/?compose=monthly")
    test.block()
    test.browser.history.go(-1)
    test.flush()
    expect(test.guard.proceed()).toBe(true)
    test.flush()
    expect(test.browser.location.href).toBe("https://dashboard.local/")
    expect(test.router).toHaveBeenCalledOnce()
    expect(test.onBlocked).toHaveBeenCalledOnce()
    expect(test.browser.history.state).toMatchObject({ __NA: true, tree: "base" })
    expect(test.entries[1].href).toContain("compose=monthly")
    expect(test.guard.proceed()).toBe(false)
  })

  it("protects Forward when it would switch an edited purchase to a different form", () => {
    const test = setup()
    test.browser.history.pushState({ __NA: true }, "", "/?edit=p1&month=2026-10")
    test.browser.history.pushState({ __NA: true }, "", "/?editMonthly=m1&view=monthly")
    test.browser.history.go(-1)
    test.flush()
    test.router.mockClear()
    test.block()
    test.browser.history.go(1)
    test.flush()
    expect(test.browser.location.href).toContain("edit=p1&month=2026-10")
    expect(test.router).not.toHaveBeenCalled()
    test.guard.cancel()
    test.browser.history.go(1)
    test.flush()
    expect(test.onBlocked).toHaveBeenCalledTimes(2)
    test.guard.proceed()
    test.flush()
    expect(test.browser.location.href).toContain("editMonthly=m1&view=monthly")
    expect(test.router).toHaveBeenCalledOnce()
  })

  it("preserves traversal distance across replaceState and multi-entry Back", () => {
    const test = setup()
    test.browser.history.pushState({ __NA: true }, "", "/?month=2026-10")
    test.browser.history.replaceState({ __NA: true, tree: "filtered" }, "", "/?month=2026-10&view=summary")
    test.browser.history.pushState({ __NA: true }, "", "/?month=2026-10&compose=purchase")
    test.block()
    test.browser.history.go(-2)
    test.flush()
    expect(test.browser.location.href).toContain("compose=purchase")
    test.guard.proceed()
    test.flush()
    expect(test.browser.location.href).toBe("https://dashboard.local/")
    expect(test.entries).toHaveLength(3)
    expect(test.entries[1].state).toMatchObject({ __NA: true, tree: "filtered" })
  })

  it("keeps an approved destination correct after traversing a duplicate URL while confirming", () => {
    const test = setup()
    test.browser.history.pushState({ __NA: true }, "", "/?compose=purchase")
    test.browser.history.pushState({ __NA: true }, "", "/?compose=purchase")
    test.block()
    test.browser.history.go(-2)
    test.flush()
    test.browser.history.go(-1)
    test.flush()
    expect(test.browser.location.href).toContain("compose=purchase")
    test.guard.proceed()
    test.flush()
    expect(test.browser.location.href).toBe("https://dashboard.local/")
  })

  it("lets clean forms navigate without confirmation", () => {
    const test = setup()
    test.browser.history.pushState({ __NA: true }, "", "/?compose=purchase")
    test.browser.history.go(-1)
    test.flush()
    expect(test.browser.location.href).toBe("https://dashboard.local/")
    expect(test.onBlocked).not.toHaveBeenCalled()
    expect(test.router).toHaveBeenCalledOnce()
  })

  it("also blocks a traversal during submission without requiring a discard prompt", () => {
    const test = setup()
    test.browser.history.pushState({ __NA: true }, "", "/?compose=purchase")
    test.block()
    test.onBlocked.mockImplementation(() => test.guard.cancel())
    test.browser.history.go(-1)
    test.flush()
    expect(test.router).not.toHaveBeenCalled()
    expect(test.browser.location.href).toContain("compose=purchase")
    expect(test.guard.proceed()).toBe(false)
  })

  it("keeps the draft safe when the previous entry predates tracking", () => {
    const test = createBrowser()
    test.browser.history.pushState({ __NA: true }, "", "/?compose=monthly")
    const navigate = vi.fn()
    const onBlocked = vi.fn()
    const guard = installExpenseNavigationGuard(test.browser, { isBlocked: () => true, onBlocked, navigate })
    guard.trackHistory()
    const router = vi.fn()
    test.listenToRouter(router)
    test.browser.history.go(-1)
    test.flush()
    expect(test.browser.location.href).toContain("compose=monthly")
    expect(router).not.toHaveBeenCalled()
    expect(onBlocked).toHaveBeenCalledOnce()
    guard.proceed()
    expect(navigate).toHaveBeenCalledWith("https://dashboard.local/")
  })

  it("removes listeners and restores the router's history methods on cleanup", () => {
    const test = setup()
    test.browser.history.pushState({ __NA: true }, "", "/?compose=purchase")
    test.block()
    test.guard.dispose()
    expect(test.browser.history.pushState).toBe(test.originalPush)
    expect(test.browser.history.replaceState).toBe(test.originalReplace)
    test.browser.history.go(-1)
    test.flush()
    expect(test.router).toHaveBeenCalledOnce()
    expect(test.onBlocked).not.toHaveBeenCalled()
  })

  it("subscribes before the router but wraps its history methods only after router setup", () => {
    const test = createBrowser()
    const onBlocked = vi.fn()
    const guard = installExpenseNavigationGuard(test.browser, { isBlocked: () => true, onBlocked, navigate: vi.fn() })
    const router = vi.fn()
    test.listenToRouter(router)
    const push = test.browser.history.pushState
    const routerPush: History["pushState"] = (data, unused, url) => push(data, unused, url)
    test.browser.history.pushState = routerPush
    guard.trackHistory()
    test.browser.history.pushState({ __NA: true }, "", "/?compose=purchase")
    test.browser.history.go(-1)
    test.flush()
    expect(router).not.toHaveBeenCalled()
    expect(onBlocked).toHaveBeenCalledOnce()
    guard.dispose()
    expect(test.browser.history.pushState).toBe(routerPush)
  })
})
