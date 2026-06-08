"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type LowStockVariant = {
  productId: string
  productName: string
  size: string
  stockQuantity: number
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] || char)
}

export function AdminLowStockReportButton({ items, threshold }: { items: LowStockVariant[]; threshold: number }) {
  const openReport = () => {
    if (items.length === 0) return
    const reportWindow = window.open("", "_blank")
    if (!reportWindow) return
    const generatedAt = new Date().toLocaleString("pt-BR")

    reportWindow.document.write(`<!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatório de estoque baixo</title>
          <style>
            body { color: #10233f; font-family: Arial, sans-serif; margin: 32px; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            p { color: #64748b; font-size: 12px; margin: 0 0 18px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border-bottom: 1px solid #d9e2ef; font-size: 12px; padding: 10px 8px; text-align: left; }
            th { background: #f4f7fb; color: #0f274d; font-size: 11px; text-transform: uppercase; }
            .center { text-align: center; }
            .stock { color: #c3222a; font-weight: 700; text-align: center; }
            @media print { body { margin: 18mm; } button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="float:right;padding:10px 16px;border-radius:999px;border:1px solid #d9e2ef;background:white;font-weight:700;cursor:pointer">Imprimir / Salvar PDF</button>
          <h1>Relatório de estoque baixo</h1>
          <p>Gerado em ${escapeHtml(generatedAt)}. Itens abaixo de ${threshold} unidades.</p>
          <table>
            <thead><tr><th>Produto</th><th class="center">Tamanho</th><th class="center">Estoque</th></tr></thead>
            <tbody>${items.map(item => `<tr><td>${escapeHtml(item.productName)}</td><td class="center">${escapeHtml(item.size)}</td><td class="stock">${escapeHtml(item.stockQuantity)} un.</td></tr>`).join("")}</tbody>
          </table>
          <script>window.onload = () => window.print()</script>
        </body>
      </html>`)
    reportWindow.document.close()
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={openReport} disabled={items.length === 0}>
      <Download className="h-3.5 w-3.5" />PDF
    </Button>
  )
}
