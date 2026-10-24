"use client"

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerHeading,
  DrawerTitle,
} from "@/components/ui/drawer"

export type ExpenseFormStatus = { dirty: boolean; pending: boolean }

// Scroll only the fields, never the page behind the modal.
function revealField(container: HTMLDivElement, field: HTMLElement) {
  const fieldBounds = field.getBoundingClientRect()
  const bounds = container.getBoundingClientRect()
  if (fieldBounds.top < bounds.top + 16) {
    container.scrollTop += fieldBounds.top - bounds.top - 16
  } else if (fieldBounds.bottom > bounds.bottom - 16) {
    container.scrollTop += fieldBounds.bottom - bounds.bottom + 16
  }
}

export function useExpenseForm(
  initialValues: object,
  pending: boolean,
  state: { status: string; fieldErrors?: object },
  onStatusChange: (status: ExpenseFormStatus) => void
) {
  const [initialFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialValues).map(([name, value]) => [name, String(value ?? "")])
    )
  )
  const [values, setValues] = useState(initialFields)
  const formRef = useRef<HTMLFormElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const dirty = Object.keys(initialFields).some((name) => values[name] !== initialFields[name])

  function setFieldValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function onFieldChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFieldValue(event.target.name, event.target.value)
  }

  useEffect(() => {
    onStatusChange({ dirty, pending })
  }, [dirty, pending, onStatusChange])

  useEffect(() => {
    if (state.status !== "error") return
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    const container = scrollRef.current
    if (invalid && container) {
      invalid.focus({ preventScroll: true })
      revealField(container, invalid)
    } else if (container) {
      container.scrollTop = 0
    }
  }, [state])

  useEffect(() => {
    const viewport = window.visualViewport
    let frame = 0
    function revealActiveField() {
      const container = scrollRef.current
      const field = document.activeElement
      if (container && field instanceof HTMLElement && container.contains(field)) {
        revealField(container, field)
      }
    }
    function scheduleReveal() {
      cancelAnimationFrame(frame)
      // The drawer updates its height in the same viewport event.
      frame = requestAnimationFrame(revealActiveField)
    }
    viewport?.addEventListener("resize", scheduleReveal)
    window.addEventListener("resize", scheduleReveal)
    return () => {
      cancelAnimationFrame(frame)
      viewport?.removeEventListener("resize", scheduleReveal)
      window.removeEventListener("resize", scheduleReveal)
    }
  }, [])

  return { values, setFieldValue, onFieldChange, formRef, scrollRef, dirty }
}

type ExpenseFormLayoutProps = {
  form: ReturnType<typeof useExpenseForm>
  action: (data: FormData) => void
  title: string
  description: string
  icon: ReactNode
  submitLabel: string
  pending: boolean
  onCancel: () => void
  onStatusChange: (status: ExpenseFormStatus) => void
  alert: ReactNode
  hiddenFields: ReactNode
  children: ReactNode
}

export function ExpenseFormLayout({
  form, action, title, description, icon, submitLabel, pending,
  onCancel, onStatusChange, alert, hiddenFields, children,
}: ExpenseFormLayoutProps) {
  const { formRef, scrollRef, dirty } = form
  return (
    <>
      <DrawerHeader className="shrink-0 pr-14">
        <DrawerHeading>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeading>
        <div className="hidden size-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary sm:flex">
          {icon}
        </div>
      </DrawerHeader>
      <form
        ref={formRef}
        action={action}
        aria-busy={pending}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onSubmit={(event) => {
          if (pending) event.preventDefault()
          else onStatusChange({ dirty, pending: true })
        }}
        onFocusCapture={(event) => {
          if (scrollRef.current && event.target instanceof HTMLElement) {
            revealField(scrollRef.current, event.target)
          }
        }}
      >
        {hiddenFields}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scroll-padding-block:1rem] [-webkit-overflow-scrolling:touch] lg:px-6 lg:py-5"
        >
          {alert ? <div className="mb-4">{alert}</div> : null}
          <fieldset disabled={pending} className="min-w-0">
            {children}
          </fieldset>
        </div>
        <DrawerFooter>
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="lg" disabled={pending} onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="min-w-0 flex-1" disabled={pending}>
              {pending ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : icon}
              {pending ? "Salvando…" : submitLabel}
            </Button>
          </div>
        </DrawerFooter>
      </form>
    </>
  )
}
