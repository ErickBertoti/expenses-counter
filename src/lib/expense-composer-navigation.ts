const composerParams = ["compose", "edit", "editMonthly", "flash"]

function dashboardQuery(url: URL) {
  const params = new URLSearchParams(url.search)
  for (const key of composerParams) params.delete(key)
  params.sort()
  return params.toString()
}

// Only presentation state is shallow: filters, tabs and other routes still need
// server navigation. Next integrates native history with useSearchParams.
export function navigateExpenseComposer(browser: Window, href: string, replace = false) {
  const current = new URL(browser.location.href)
  const next = new URL(href, current)
  if (next.origin !== current.origin || next.pathname !== current.pathname ||
      next.hash !== current.hash || dashboardQuery(next) !== dashboardQuery(current)) return false
  browser.history[replace ? "replaceState" : "pushState"](null, "", next.href)
  return true
}
