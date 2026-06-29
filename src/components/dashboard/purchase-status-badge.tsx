import { Badge } from "@/components/ui/badge"
import type { PurchaseWithProgress } from "@/lib/types"

export function PurchaseStatusBadge({
  status,
}: {
  status: PurchaseWithProgress["status"]
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
