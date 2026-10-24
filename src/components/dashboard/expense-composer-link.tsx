"use client"

import type { ComponentProps } from "react"

import { navigateExpenseComposer } from "@/lib/expense-composer-navigation"

// A normal anchor preserves direct links, opening in another tab and the
// pre-hydration fallback, without prefetching the entire dashboard for a modal.
export function ExpenseComposerLink({ href, onClick, ...props }: ComponentProps<"a"> & { href: string }) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
            event.shiftKey || event.altKey || props.download !== undefined ||
            (props.target && props.target !== "_self")) return
        if (navigateExpenseComposer(window, href)) event.preventDefault()
      }}
    />
  )
}
