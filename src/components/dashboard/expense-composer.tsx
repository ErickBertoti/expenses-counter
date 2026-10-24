"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
import { resolveExpenseComposerMode, type ExpenseComposerMode } from "@/lib/dashboard-url"
import type { CardRecord, MonthlyExpenseFormValues, PurchaseFormValues } from "@/lib/types"

type ExpenseComposerProps = {
  cards: CardRecord[]
  formValues: PurchaseFormValues
  monthlyExpenseFormValues: MonthlyExpenseFormValues
  selectedPurchaseId?: string
  selectedMonthlyExpenseId?: string
  returnTo: string
}

function ComposerSession({
  mode, cards, formValues, monthlyExpenseFormValues, returnTo,
}: ExpenseComposerProps & { mode: ExpenseComposerMode }) {
  const router = useRouter()
  const [status, setStatus] = useState<ExpenseFormStatus>({ dirty: false, pending: false })
  const [discardOpen, setDiscardOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const openerRef = useRef<HTMLElement | null>(null)

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
        const target = previous?.isConnected && previous !== document.body ? previous : fallback
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
    router.replace(returnTo, { scroll: false })
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
            onStatusChange={setStatus}
          />
        ) : (
          <MonthlyExpenseForm
            cards={cards}
            initialValues={monthlyExpenseFormValues}
            isEditing={mode.isEditing}
            returnTo={returnTo}
            onCancel={requestClose}
            onStatusChange={setStatus}
          />
        )}
      </DrawerContent>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
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
                close()
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
  const searchParams = useSearchParams()
  const mode = resolveExpenseComposerMode(
    searchParams.toString(), props.selectedPurchaseId, props.selectedMonthlyExpenseId
  )
  if (!mode) return null
  return <ComposerSession key={mode.key} {...props} mode={mode} />
}
