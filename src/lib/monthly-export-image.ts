import { getMonthlyExportFileName } from "@/lib/monthly-export"
import { formatCurrencyFromCents } from "@/lib/purchases"
import type {
  MonthlyExportExpenseItem,
  MonthlyExportModel,
  MonthlyExportPurchaseItem,
} from "@/lib/types"

const WIDTH = 1080
const PADDING = 64
const CONTENT_WIDTH = WIDTH - PADDING * 2

const palette = {
  background: "#170706",
  surface: "#24100d",
  surfaceMuted: "#301511",
  border: "#5a241a",
  text: "#fff1d6",
  muted: "#d9a979",
  dim: "#a96c4d",
  red: "#f06d35",
  amber: "#ffd38c",
  burgundy: "#5c1712",
}

function setFont(
  context: CanvasRenderingContext2D,
  size: number,
  weight: number | "normal" = "normal"
) {
  context.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
}

function drawRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  )
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

function fillRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string
) {
  drawRoundRect(context, x, y, width, height, radius)
  context.fillStyle = fillStyle
  context.fill()
}

function strokeRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string
) {
  drawRoundRect(context, x, y, width, height, radius)
  context.strokeStyle = strokeStyle
  context.lineWidth = 2
  context.stroke()
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word

    if (context.measureText(nextLine).width <= maxWidth) {
      line = nextLine
      continue
    }

    if (line) {
      lines.push(line)
      line = ""
    }

    if (context.measureText(word).width <= maxWidth) {
      line = word
      continue
    }

    let chunk = ""
    for (const character of word) {
      const nextChunk = `${chunk}${character}`
      if (context.measureText(nextChunk).width > maxWidth && chunk) {
        lines.push(chunk)
        chunk = character
      } else {
        chunk = nextChunk
      }
    }
    line = chunk
  }

  if (line) {
    lines.push(line)
  }

  return lines.length > 0 ? lines : [""]
}

type PreparedPurchase = MonthlyExportPurchaseItem & {
  descriptionLines: string[]
  noteLines: string[]
  rowHeight: number
}

type PreparedExpense = MonthlyExportExpenseItem & {
  descriptionLines: string[]
  noteLines: string[]
  rowHeight: number
}

function preparePurchases(
  context: CanvasRenderingContext2D,
  purchases: MonthlyExportPurchaseItem[]
): PreparedPurchase[] {
  return purchases.map((purchase) => {
    setFont(context, 30, 700)
    const descriptionLines = wrapText(context, purchase.description, 560)
    setFont(context, 24)
    const noteLines = purchase.notes
      ? wrapText(context, `Obs.: ${purchase.notes}`, 780)
      : []
    const rowHeight = 72 + descriptionLines.length * 36 + noteLines.length * 30

    return {
      ...purchase,
      descriptionLines,
      noteLines,
      rowHeight,
    }
  })
}

function prepareExpenses(
  context: CanvasRenderingContext2D,
  monthlyExpenses: MonthlyExportExpenseItem[]
): PreparedExpense[] {
  return monthlyExpenses.map((monthlyExpense) => {
    setFont(context, 30, 700)
    const descriptionLines = wrapText(context, monthlyExpense.description, 600)
    setFont(context, 24)
    const noteLines = monthlyExpense.notes
      ? wrapText(context, `Obs.: ${monthlyExpense.notes}`, 780)
      : []
    const rowHeight = 72 + descriptionLines.length * 36 + noteLines.length * 30

    return {
      ...monthlyExpense,
      descriptionLines,
      noteLines,
      rowHeight,
    }
  })
}

function measureHeight(
  model: MonthlyExportModel,
  purchases: PreparedPurchase[],
  monthlyExpenses: PreparedExpense[]
) {
  const byCardHeight = Math.max(model.by_card.length, 1) * 52
  const purchasesHeight =
    purchases.length === 0
      ? 62
      : purchases.reduce((total, purchase) => total + purchase.rowHeight, 0)
  const monthlyExpensesHeight =
    monthlyExpenses.length === 0
      ? 62
      : monthlyExpenses.reduce(
          (total, monthlyExpense) => total + monthlyExpense.rowHeight,
          0
        )

  return (
    184 +
    142 +
    100 +
    byCardHeight +
    92 +
    purchasesHeight +
    92 +
    monthlyExpensesHeight +
    96
  )
}

function drawSectionTitle(
  context: CanvasRenderingContext2D,
  title: string,
  y: number
) {
  setFont(context, 28, 700)
  context.fillStyle = palette.text
  context.fillText(title, PADDING, y)
}

function drawMetric(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  fillRoundRect(context, x, y, width, 112, 24, palette.surface)
  strokeRoundRect(context, x, y, width, 112, 24, palette.border)

  setFont(context, 22, 600)
  context.fillStyle = palette.muted
  context.fillText(label, x + 24, y + 38)

  setFont(context, 31, 800)
  context.fillStyle = palette.text
  context.fillText(value, x + 24, y + 82)
}

function drawEmptyLine(
  context: CanvasRenderingContext2D,
  text: string,
  y: number
) {
  setFont(context, 26)
  context.fillStyle = palette.muted
  context.fillText(text, PADDING, y)
}

function drawDocument(
  context: CanvasRenderingContext2D,
  model: MonthlyExportModel,
  purchases: PreparedPurchase[],
  monthlyExpenses: PreparedExpense[]
) {
  const gradient = context.createLinearGradient(0, 0, WIDTH, 0)
  gradient.addColorStop(0, palette.burgundy)
  gradient.addColorStop(0.55, palette.background)
  gradient.addColorStop(1, "#2a0d0b")
  context.fillStyle = gradient
  context.fillRect(0, 0, WIDTH, context.canvas.height)

  context.fillStyle = "rgba(255, 211, 140, 0.08)"
  context.beginPath()
  context.arc(WIDTH - 140, 110, 260, 0, Math.PI * 2)
  context.fill()

  setFont(context, 28, 700)
  context.fillStyle = palette.amber
  context.fillText("Resumo mensal", PADDING, 82)

  setFont(context, 54, 800)
  context.fillStyle = palette.text
  context.fillText(model.month_label, PADDING, 144)

  let y = 188
  const metricGap = 18
  const metricWidth = (CONTENT_WIDTH - metricGap * 2) / 3
  drawMetric(
    context,
    "Total a pagar",
    formatCurrencyFromCents(model.total_amount_cents),
    PADDING,
    y,
    metricWidth
  )
  drawMetric(
    context,
    "Parcelas",
    formatCurrencyFromCents(model.installment_total_cents),
    PADDING + metricWidth + metricGap,
    y,
    metricWidth
  )
  drawMetric(
    context,
    "Mensalidades",
    formatCurrencyFromCents(model.monthly_total_cents),
    PADDING + (metricWidth + metricGap) * 2,
    y,
    metricWidth
  )

  y += 174
  drawSectionTitle(context, "Por cartão", y)
  y += 44

  if (model.by_card.length === 0) {
    drawEmptyLine(context, "Nenhum valor neste mês.", y)
    y += 52
  } else {
    const maxByCard = Math.max(
      ...model.by_card.map((card) => card.total_amount_cents)
    )

    model.by_card.forEach((card) => {
      const barWidth = Math.max(
        8,
        Math.round((card.total_amount_cents / maxByCard) * 430)
      )

      setFont(context, 25, 650)
      context.fillStyle = palette.text
      context.fillText(card.card_name, PADDING, y)

      setFont(context, 25, 700)
      context.textAlign = "right"
      context.fillText(
        formatCurrencyFromCents(card.total_amount_cents),
        WIDTH - PADDING,
        y
      )
      context.textAlign = "left"

      fillRoundRect(context, PADDING, y + 16, 430, 16, 8, palette.surfaceMuted)
      fillRoundRect(context, PADDING, y + 16, barWidth, 16, 8, palette.red)
      y += 52
    })
  }

  y += 34
  drawSectionTitle(context, "Compras parceladas", y)
  y += 44

  if (purchases.length === 0) {
    drawEmptyLine(context, "Nenhuma compra parcelada neste mês.", y)
    y += 62
  } else {
    purchases.forEach((purchase) => {
      fillRoundRect(
        context,
        PADDING,
        y - 24,
        CONTENT_WIDTH,
        purchase.rowHeight - 18,
        22,
        palette.surface
      )
      strokeRoundRect(
        context,
        PADDING,
        y - 24,
        CONTENT_WIDTH,
        purchase.rowHeight - 18,
        22,
        palette.border
      )

      setFont(context, 30, 700)
      context.fillStyle = palette.text
      purchase.descriptionLines.forEach((line) => {
        context.fillText(line, PADDING + 24, y + 12)
        y += 36
      })

      setFont(context, 23)
      context.fillStyle = palette.muted
      context.fillText(
        `${purchase.card_name} · Parcela ${purchase.installment_index}/${purchase.installment_count}`,
        PADDING + 24,
        y + 12
      )

      setFont(context, 24, 700)
      context.fillStyle = palette.amber
      context.textAlign = "right"
      context.fillText(
        `${formatCurrencyFromCents(
          purchase.installment_amount_cents
        )} no mês`,
        WIDTH - PADDING - 24,
        y - 20
      )
      context.fillStyle = palette.muted
      context.fillText(
        `Total: ${formatCurrencyFromCents(purchase.total_amount_cents)}`,
        WIDTH - PADDING - 24,
        y + 14
      )
      context.textAlign = "left"
      y += 36

      if (purchase.noteLines.length > 0) {
        setFont(context, 23)
        context.fillStyle = palette.dim
        purchase.noteLines.forEach((line) => {
          context.fillText(line, PADDING + 24, y + 12)
          y += 30
        })
      }

      y += 20
    })
  }

  y += 22
  drawSectionTitle(context, "Mensalidades", y)
  y += 44

  if (monthlyExpenses.length === 0) {
    drawEmptyLine(context, "Nenhuma mensalidade neste mês.", y)
    y += 62
  } else {
    monthlyExpenses.forEach((monthlyExpense) => {
      fillRoundRect(
        context,
        PADDING,
        y - 24,
        CONTENT_WIDTH,
        monthlyExpense.rowHeight - 18,
        22,
        palette.surface
      )
      strokeRoundRect(
        context,
        PADDING,
        y - 24,
        CONTENT_WIDTH,
        monthlyExpense.rowHeight - 18,
        22,
        palette.border
      )

      setFont(context, 30, 700)
      context.fillStyle = palette.text
      monthlyExpense.descriptionLines.forEach((line) => {
        context.fillText(line, PADDING + 24, y + 12)
        y += 36
      })

      setFont(context, 23)
      context.fillStyle = palette.muted
      context.fillText(
        `${monthlyExpense.card_name} · ${monthlyExpense.period_label}`,
        PADDING + 24,
        y + 12
      )

      setFont(context, 25, 800)
      context.fillStyle = palette.amber
      context.textAlign = "right"
      context.fillText(
        formatCurrencyFromCents(monthlyExpense.amount_cents),
        WIDTH - PADDING - 24,
        y - 2
      )
      context.textAlign = "left"
      y += 36

      if (monthlyExpense.noteLines.length > 0) {
        setFont(context, 23)
        context.fillStyle = palette.dim
        monthlyExpense.noteLines.forEach((line) => {
          context.fillText(line, PADDING + 24, y + 12)
          y += 30
        })
      }

      y += 20
    })
  }

  setFont(context, 23)
  context.fillStyle = palette.dim
  context.fillText(
    "Itens desativados não entram neste resumo.",
    PADDING,
    context.canvas.height - 48
  )
}

export async function buildMonthlyExportPngBlob(model: MonthlyExportModel) {
  const measureCanvas = document.createElement("canvas")
  const measureContext = measureCanvas.getContext("2d")

  if (!measureContext) {
    throw new Error("Não foi possível preparar a imagem.")
  }

  const purchases = preparePurchases(measureContext, model.purchases)
  const monthlyExpenses = prepareExpenses(
    measureContext,
    model.monthly_expenses
  )
  const height = Math.max(900, measureHeight(model, purchases, monthlyExpenses))
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = height
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Não foi possível gerar a imagem.")
  }

  drawDocument(context, model, purchases, monthlyExpenses)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Não foi possível finalizar a imagem."))
        return
      }

      resolve(blob)
    }, "image/png")
  })
}

export function downloadMonthlyExportImage(
  model: MonthlyExportModel,
  blob: Blob
) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = getMonthlyExportFileName(model)
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
