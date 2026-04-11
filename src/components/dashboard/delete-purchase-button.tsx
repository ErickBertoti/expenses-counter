"use client"

import { startTransition, useState } from "react"
import { Loader2Icon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { deletePurchase } from "@/app/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DeletePurchaseButtonProps = {
  purchaseId: string
  description: string
}

export function DeletePurchaseButton({
  purchaseId,
  description,
}: DeletePurchaseButtonProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  function handleDelete() {
    setPending(true)

    startTransition(async () => {
      try {
        await deletePurchase(purchaseId)
        setOpen(false)
        toast.success("Compra excluída.")
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a compra."
        )
      } finally {
        setPending(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        aria-label={`Excluir ${description}`}
      >
        <Trash2Icon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir compra</AlertDialogTitle>
          <AlertDialogDescription>
            {`"${description}" será removida de vez. As parcelas deixam de
            aparecer nos totais mensais imediatamente.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <Trash2Icon data-icon="inline-start" />
            )}
            Excluir compra
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
