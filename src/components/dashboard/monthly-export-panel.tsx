"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import {
  ClipboardIcon,
  DownloadIcon,
  ImageIcon,
  Share2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  buildMonthlyExportText,
  getMonthlyExportFileName,
} from "@/lib/monthly-export"
import {
  buildMonthlyExportPngBlob,
  downloadMonthlyExportImage,
} from "@/lib/monthly-export-image"
import { formatCurrencyFromCents } from "@/lib/purchases"
import type { MonthlyExportModel } from "@/lib/types"

type MonthlyExportPanelProps = {
  model: MonthlyExportModel
}

async function buildImageFile(model: MonthlyExportModel) {
  const blob = await buildMonthlyExportPngBlob(model)
  return new File([blob], getMonthlyExportFileName(model), {
    type: "image/png",
  })
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

const subscribeToCapabilities = () => () => {}
const serverCapabilities = () => 0

function imageCapabilities() {
  const probeFile = new File([""], "resumo.png", { type: "image/png" })
  const canShare = typeof navigator.canShare === "function" && navigator.canShare({ files: [probeFile] })
  const canCopy = typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function"
  return (canShare ? 1 : 0) | (canCopy ? 2 : 0)
}

export function MonthlyExportPanel({ model }: MonthlyExportPanelProps) {
  const exportText = useMemo(() => buildMonthlyExportText(model), [model])
  const capabilities = useSyncExternalStore(subscribeToCapabilities, imageCapabilities, serverCapabilities)
  const canShareImage = Boolean(capabilities & 1)
  const canCopyImage = Boolean(capabilities & 2)
  const [busyAction, setBusyAction] = useState<
    "copy-text" | "copy-image" | "download" | "share" | null
  >(null)

  async function copyText() {
    setBusyAction("copy-text")
    try {
      await navigator.clipboard.writeText(exportText)
      toast.success("Resumo copiado.")
    } catch {
      toast.error("Não foi possível copiar o texto.")
    } finally {
      setBusyAction(null)
    }
  }

  async function copyImage() {
    setBusyAction("copy-image")
    try {
      const blob = await buildMonthlyExportPngBlob(model)
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ])
      toast.success("Imagem copiada.")
    } catch {
      toast.error("Não foi possível copiar a imagem.")
    } finally {
      setBusyAction(null)
    }
  }

  async function downloadImage() {
    setBusyAction("download")
    try {
      const blob = await buildMonthlyExportPngBlob(model)
      downloadMonthlyExportImage(model, blob)
      toast.success("Imagem gerada.")
    } catch {
      toast.error("Não foi possível baixar a imagem.")
    } finally {
      setBusyAction(null)
    }
  }

  async function shareImage() {
    setBusyAction("share")
    try {
      const file = await buildImageFile(model)

      if (
        typeof navigator.canShare !== "function" ||
        !navigator.canShare({ files: [file] })
      ) {
        downloadMonthlyExportImage(model, file)
        toast.info("Compartilhamento indisponível. A imagem foi baixada.")
        return
      }

      await navigator.share({
        files: [file],
        text: `Resumo de ${model.month_label}`,
        title: `Resumo de ${model.month_label}`,
      })
    } catch (error) {
      if (!isAbortError(error)) {
        toast.error("Não foi possível compartilhar a imagem.")
      }
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section
      aria-label={`Exportar resumo de ${model.month_label}`}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Exportar mês
          </div>
          <h2 className="mt-2 font-heading text-lg font-semibold">
            Documento de {model.month_label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Texto pronto para WhatsApp/email e imagem PNG com a composição do mês
            completo, sem itens desativados.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={copyText}
            disabled={busyAction !== null}
          >
            <ClipboardIcon data-icon="inline-start" />
            {busyAction === "copy-text" ? "Copiando" : "Copiar texto"}
          </Button>
          {canCopyImage ? (
            <Button
              type="button"
              variant="outline"
              onClick={copyImage}
              disabled={busyAction !== null}
            >
              <ImageIcon data-icon="inline-start" />
              {busyAction === "copy-image" ? "Copiando" : "Copiar imagem"}
            </Button>
          ) : null}
          {canShareImage ? (
            <Button
              type="button"
              variant="outline"
              onClick={shareImage}
              disabled={busyAction !== null}
            >
              <Share2Icon data-icon="inline-start" />
              {busyAction === "share" ? "Abrindo" : "Compartilhar"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={downloadImage}
            disabled={busyAction !== null}
          >
            <DownloadIcon data-icon="inline-start" />
            {busyAction === "download" ? "Gerando" : "Baixar PNG"}
          </Button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-[#5a241a] bg-[#170706] text-[#fff1d6]">
        <div className="border-b border-[#5a241a] bg-[#24100d] p-4">
          <div className="text-xs uppercase tracking-[0.12em] text-[#ffd38c]">
            Prévia
          </div>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-heading text-xl font-semibold">
                Resumo de {model.month_label}
              </h3>
              <p className="mt-1 text-sm text-[#d9a979]">
                {model.item_count} itens no mês completo
              </p>
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              {formatCurrencyFromCents(model.total_amount_cents)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="rounded-md bg-[#301511] p-3">
            <div className="text-xs text-[#d9a979]">Parcelas</div>
            <div className="mt-1 font-semibold tabular-nums">
              {formatCurrencyFromCents(model.installment_total_cents)}
            </div>
          </div>
          <div className="rounded-md bg-[#301511] p-3">
            <div className="text-xs text-[#d9a979]">Mensalidades</div>
            <div className="mt-1 font-semibold tabular-nums">
              {formatCurrencyFromCents(model.monthly_total_cents)}
            </div>
          </div>
          <div className="rounded-md bg-[#301511] p-3">
            <div className="text-xs text-[#d9a979]">Cartões</div>
            <div className="mt-1 font-semibold tabular-nums">
              {model.by_card.length}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[#5a241a] p-4 xl:grid-cols-2">
          <div>
            <h4 className="font-medium">Compras parceladas</h4>
            <div className="mt-3 flex flex-col gap-2">
              {model.purchases.length === 0 ? (
                <p className="text-sm text-[#d9a979]">
                  Nenhuma compra parcelada neste mês.
                </p>
              ) : (
                model.purchases.slice(0, 4).map((purchase) => (
                  <div
                    key={`${purchase.id}:${purchase.installment_index}`}
                    className="rounded-md bg-[#24100d] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {purchase.description}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#d9a979]">
                          <span>{purchase.card_name}</span>
                          <span className="rounded-full border border-[#5a241a] px-2 py-0.5 text-[#ffd38c]">
                            {purchase.installment_index}/
                            {purchase.installment_count}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums">
                        {formatCurrencyFromCents(
                          purchase.installment_amount_cents
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {model.purchases.length > 4 ? (
                <p className="text-xs text-[#d9a979]">
                  +{model.purchases.length - 4} compras no documento completo.
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <h4 className="font-medium">Mensalidades</h4>
            <div className="mt-3 flex flex-col gap-2">
              {model.monthly_expenses.length === 0 ? (
                <p className="text-sm text-[#d9a979]">
                  Nenhuma mensalidade neste mês.
                </p>
              ) : (
                model.monthly_expenses.slice(0, 4).map((monthlyExpense) => (
                  <div
                    key={monthlyExpense.id}
                    className="rounded-md bg-[#24100d] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {monthlyExpense.description}
                        </div>
                        <div className="mt-1 text-xs text-[#d9a979]">
                          {monthlyExpense.card_name}
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums">
                        {formatCurrencyFromCents(monthlyExpense.amount_cents)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {model.monthly_expenses.length > 4 ? (
                <p className="text-xs text-[#d9a979]">
                  +{model.monthly_expenses.length - 4} mensalidades no documento
                  completo.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
