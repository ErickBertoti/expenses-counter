"use client"

import { startTransition, useState } from "react"
import type { ComponentProps } from "react"
import { Loader2Icon, PauseCircleIcon, PlayCircleIcon } from "lucide-react"
import { toast } from "sonner"

import {
  setMonthlyExpenseDisabled,
  setPurchaseDisabled,
} from "@/app/actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ToggleButtonProps = {
  className?: string
  description: string
  disabledState: boolean
  showLabel?: boolean
  size?: ComponentProps<typeof Button>["size"]
  variant?: ComponentProps<typeof Button>["variant"]
}

type PurchaseDisabledToggleButtonProps = ToggleButtonProps & {
  purchaseId: string
}

type MonthlyExpenseDisabledToggleButtonProps = ToggleButtonProps & {
  monthlyExpenseId: string
}

function ToggleIcon({
  disabledState,
  pending,
}: {
  disabledState: boolean
  pending: boolean
}) {
  if (pending) {
    return <Loader2Icon className="animate-spin" data-icon="inline-start" />
  }

  return disabledState ? (
    <PlayCircleIcon data-icon="inline-start" />
  ) : (
    <PauseCircleIcon data-icon="inline-start" />
  )
}

export function PurchaseDisabledToggleButton({
  purchaseId,
  className,
  description,
  disabledState,
  showLabel = false,
  size = showLabel ? "sm" : "icon-sm",
  variant = "ghost",
}: PurchaseDisabledToggleButtonProps) {
  const [pending, setPending] = useState(false)
  const nextDisabledState = !disabledState
  const label = disabledState ? "Ativar" : "Desativar"

  function handleToggle() {
    setPending(true)

    startTransition(async () => {
      try {
        await setPurchaseDisabled(purchaseId, nextDisabledState)
        toast.success(
          nextDisabledState ? "Compra desativada." : "Compra ativada."
        )
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a compra."
        )
      } finally {
        setPending(false)
      }
    })
  }

  return (
    <Button
      type="button"
      className={cn(className)}
      variant={variant}
      size={size}
      disabled={pending}
      onClick={handleToggle}
      aria-label={`${label} ${description}`}
    >
      <ToggleIcon disabledState={disabledState} pending={pending} />
      {showLabel ? label : null}
    </Button>
  )
}

export function MonthlyExpenseDisabledToggleButton({
  monthlyExpenseId,
  className,
  description,
  disabledState,
  showLabel = false,
  size = showLabel ? "sm" : "icon-sm",
  variant = "ghost",
}: MonthlyExpenseDisabledToggleButtonProps) {
  const [pending, setPending] = useState(false)
  const nextDisabledState = !disabledState
  const label = disabledState ? "Ativar" : "Desativar"

  function handleToggle() {
    setPending(true)

    startTransition(async () => {
      try {
        await setMonthlyExpenseDisabled(monthlyExpenseId, nextDisabledState)
        toast.success(
          nextDisabledState ? "Mensalidade desativada." : "Mensalidade ativada."
        )
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar a mensalidade."
        )
      } finally {
        setPending(false)
      }
    })
  }

  return (
    <Button
      type="button"
      className={cn(className)}
      variant={variant}
      size={size}
      disabled={pending}
      onClick={handleToggle}
      aria-label={`${label} ${description}`}
    >
      <ToggleIcon disabledState={disabledState} pending={pending} />
      {showLabel ? label : null}
    </Button>
  )
}
