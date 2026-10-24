const POSITION = "__expensesCounterHistoryPosition"

type GuardOptions = {
  isBlocked: () => boolean
  onBlocked: () => void
  navigate: (href: string) => void
}

function readPosition(state: unknown): number | null {
  if (!state || typeof state !== "object") return null
  const value = (state as Record<string, unknown>)[POSITION]
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null
}

function withPosition(state: unknown, position: number) {
  return { ...(state && typeof state === "object" ? state : {}), [POSITION]: position }
}

// popstate cannot be canceled. Restore the original entry before letting the
// router see the traversal, then replay that exact traversal only after approval.
export function installExpenseNavigationGuard(browser: Window, options: GuardOptions) {
  const history = browser.history
  let originalPush = history.pushState
  let originalReplace = history.replaceState
  let tracking = false
  let active = true
  let current = {
    position: readPosition(history.state) ?? 0,
    href: browser.location.href,
    state: history.state as unknown,
  }
  let pending: { position: number } | { href: string } | null = null
  let restoring = false
  let replaying = false

  const push: History["pushState"] = function (data, unused, url) {
    const position = current.position + 1
    originalPush.call(history, active ? withPosition(data, position) : data, unused, url)
    current = { position, href: browser.location.href, state: history.state }
  }
  const replace: History["replaceState"] = function (data, unused, url) {
    originalReplace.call(history, active ? withPosition(data, current.position) : data, unused, url)
    current = { ...current, href: browser.location.href, state: history.state }
  }
  originalReplace.call(history, withPosition(current.state, current.position), "", current.href)
  current.state = history.state

  function onPopState(event: PopStateEvent) {
    if (!active) return
    const position = readPosition(event.state)
    const href = browser.location.href

    if (restoring) {
      event.stopImmediatePropagation()
      restoring = false
      if (position !== current.position || href !== current.href) {
        // A second traversal overtook the restoration. Keep the form mounted.
        push(current.state, "", current.href)
      }
      options.onBlocked()
      return
    }

    if (replaying || !options.isBlocked() || href === current.href) {
      replaying = false
      current = { position: position ?? current.position, href, state: event.state }
      return
    }

    event.stopImmediatePropagation()
    if (position === null || position === current.position) {
      // Entries from before the guard mounted have no known traversal distance.
      // Preserve the draft first; approval can then navigate to their URL.
      pending = { href }
      push(current.state, "", current.href)
      options.onBlocked()
    } else {
      pending = { position }
      restoring = true
      history.go(current.position - position)
    }
  }

  browser.addEventListener("popstate", onPopState, true)

  return {
    trackHistory() {
      if (!active || tracking) return
      // Capture Next's wrappers after its passive mount effects have run.
      originalPush = history.pushState
      originalReplace = history.replaceState
      history.pushState = push
      history.replaceState = replace
      tracking = true
    },
    proceed() {
      if (!pending || restoring) return false
      const destination = pending
      pending = null
      if ("position" in destination) {
        replaying = true
        history.go(destination.position - current.position)
      } else {
        options.navigate(destination.href)
      }
      return true
    },
    cancel() {
      pending = null
    },
    dispose() {
      active = false
      browser.removeEventListener("popstate", onPopState, true)
      if (history.pushState === push) history.pushState = originalPush
      if (history.replaceState === replace) history.replaceState = originalReplace
    },
  }
}
