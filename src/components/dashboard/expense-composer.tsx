"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { MonthlyExpenseForm } from "@/components/dashboard/monthly-expense-form"
import { PurchaseForm } from "@/components/dashboard/purchase-form"
import type { ExpenseFormStatus } from "@/components/dashboard/expense-form-layout"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer"
import type { ExpenseComposerMode } from "@/lib/dashboard-url"
import { resolveExpenseComposer, type ExpenseComposerData } from "@/lib/expense-composer-data"
import { navigateExpenseComposer } from "@/lib/expense-composer-navigation"
import { installExpenseNavigationGuard } from "@/lib/expense-navigation-guard"
import type { CardRecord, MonthlyExpenseFormValues, PurchaseFormValues } from "@/lib/types"

type ExpenseComposerProps = {
  cards: CardRecord[]
  data: ExpenseComposerData
  returnTo: string
}

type HistoryProtection = {
  discardOpen: boolean
  updateStatus: (status: ExpenseFormStatus) => void
  cancel: () => void
  proceed: () => boolean
}

function ComposerSession({
  mode, cards, formValues, monthlyExpenseFormValues, returnTo, historyProtection,
}: Pick<ExpenseComposerProps, "cards" | "returnTo"> & {
  formValues: PurchaseFormValues
  monthlyExpenseFormValues: MonthlyExpenseFormValues
  mode: ExpenseComposerMode
  historyProtection: HistoryProtection
}) {
  const router = useRouter()
  const [status, setStatus] = useState<ExpenseFormStatus>({ dirty: false, pending: false })
  const [discardOpen, setDiscardOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const openerRef = useRef<HTMLElement | null>(null)
  const updateNavigationStatus = historyProtection.updateStatus
  const updateStatus = useCallback((next: ExpenseFormStatus) => {
    setStatus(next)
    updateNavigationStatus(next)
  }, [updateNavigationStatus])

  useEffect(() => () => {
    updateNavigationStatus({ dirty: false, pending: false })
  }, [updateNavigationStatus])

  useLayoutEffect(() => {
    const opener = document.activeElement
    openerRef.current = opener instanceof HTMLElement ? opener : null
    const scrollPosition = { left: window.scrollX, top: window.scrollY }
    return () => {
      // Server Action redirects use the router's default scroll behavior.
      // Restore the dashboard position after that navigation has committed.
      requestAnimationFrame(() => {
        if (window.location.pathname !== "/" || document.querySelector("[data-expense-composer]")) return
        window.scrollTo(scrollPosition)
        const previous = openerRef.current
        const fallback = Array.from(document.querySelectorAll<HTMLElement>(`[data-expense-trigger="${mode.kind}"]`))
          .find((element) => element.getClientRects().length > 0)
        const target = previous?.isConnected && previous !== document.body && previous.getClientRects().length > 0
          ? previous : fallback
        target?.focus({ preventScroll: true })
      })
    }
  }, [mode.kind])

  useEffect(() => {
    if (!status.dirty || status.pending) return
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [status.dirty, status.pending])

  function close() {
    setClosing(true)
    if (!navigateExpenseComposer(window, returnTo, true)) router.replace(returnTo, { scroll: false })
  }

  function requestClose() {
    if (status.pending) return
    if (status.dirty) setDiscardOpen(true)
    else close()
  }

  return (
    <Drawer
      open={!closing}
      modal
      onOpenChange={(open, details) => {
        if (open) return
        details.cancel()
        requestClose()
      }}
    >
      <DrawerContent
        responsive
        data-expense-composer=""
        initialFocus
        finalFocus={false}
      >
        <div className="absolute right-3 top-3 z-10">
          <DrawerClose disabled={status.pending} />
        </div>
        {mode.kind === "purchase" ? (
          <PurchaseForm
            cards={cards}
            initialValues={formValues}
            isEditing={mode.isEditing}
            returnTo={returnTo}
            onCancel={requestClose}
            onStatusChange={updateStatus}
          />
        ) : (
          <MonthlyExpenseForm
            cards={cards}
            initialValues={monthlyExpenseFormValues}
            isEditing={mode.isEditing}
            returnTo={returnTo}
            onCancel={requestClose}
            onStatusChange={updateStatus}
          />
        )}
      </DrawerContent>
      <AlertDialog
        open={discardOpen || historyProtection.discardOpen}
        onOpenChange={(open) => {
          setDiscardOpen(open)
          if (!open) historyProtection.cancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados preenchidos ainda não foram salvos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setDiscardOpen(false)
                if (historyProtection.proceed()) {
                  updateStatus({ dirty: false, pending: false })
                  setClosing(true)
                } else close()
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Drawer>
  )
}

export function ExpenseComposer(props: ExpenseComposerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const guardRef = useRef<ReturnType<typeof installExpenseNavigationGuard> | null>(null)
  const statusRef = useRef<ExpenseFormStatus>({ dirty: false, pending: false })
  const [historyDiscardOpen, setHistoryDiscardOpen] = useState(false)

  // Register before router/store subscriptions can unmount the active session.
  useLayoutEffect(() => {
    guardRef.current = installExpenseNavigationGuard(window, {
      isBlocked: () => statusRef.current.dirty || statusRef.current.pending,
      onBlocked: () => {
        if (statusRef.current.pending) guardRef.current?.cancel()
        else setHistoryDiscardOpen(true)
      },
      navigate: (href) => router.replace(href, { scroll: false }),
    })
    return () => {
      guardRef.current?.dispose()
      guardRef.current = null
    }
  }, [router])

  useEffect(() => {
    let disposed = false
    // Wrap history after Next installs its own pushState/replaceState methods.
    queueMicrotask(() => {
      if (!disposed) guardRef.current?.trackHistory()
    })
    return () => { disposed = true }
  }, [router])

  const updateStatus = useCallback((status: ExpenseFormStatus) => {
    statusRef.current = status
  }, [])

  const composer = resolveExpenseComposer(searchParams.toString(), props.data)
  if (!composer) return null
  return (
    <ComposerSession
      key={`${composer.mode.key}:${searchParams.toString()}`}
      cards={props.cards}
      returnTo={props.returnTo}
      {...composer}
      historyProtection={{
        discardOpen: historyDiscardOpen,
        updateStatus,
        cancel: () => {
          guardRef.current?.cancel()
          setHistoryDiscardOpen(false)
        },
        proceed: () => {
          const proceeding = guardRef.current?.proceed() ?? false
          setHistoryDiscardOpen(false)
          return proceeding
        },
      }}
    />
  )
}
