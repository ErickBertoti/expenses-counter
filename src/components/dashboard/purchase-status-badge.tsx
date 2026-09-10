import { Badge } from "@/components/ui/badge"
import type { ExpenseStatus } from "@/lib/types"

export function ExpenseStatusBadge({
  status,
}: {
  status: ExpenseStatus
}) {
  const variant =
    status === "active" ? "active" : status === "disabled" ? "disabled" : "completed"

  return (
    <Badge variant={variant}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {status === "active"
        ? "Em andamento"
        : status === "disabled"
          ? "Desativada"
          : "Concluída"}
    </Badge>
  )
}

export function PurchaseStatusBadge({ status }: { status: ExpenseStatus }) {
  return <ExpenseStatusBadge status={status} />
}
