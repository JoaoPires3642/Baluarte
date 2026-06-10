"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdminApi } from "@/lib/use-admin-api"
import type { Order } from "@/lib/api"

export function AdminSeparationReportButton() {
  const { authedFetch } = useAdminApi()
  const [date, setDate] = useState(defaultReportDate())
  const [loading, setLoading] = useState(false)

  const openReport = async () => {
    setLoading(true)
    try {
      const response = await authedFetch(`/orders/separation-report?date=${date}`) as { data: Order[] }
      const reportWindow = window.open("", "_blank")
      if (!reportWindow) return
      reportWindow.document.write(buildReportHtml(response.data || [], date))
      reportWindow.document.close()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-bold">PDF de separacao</h2>
        <p className="mt-1 text-sm text-slate-500">Fretes comuns pela data do pedido; estacoes pela entrega do dia seguinte.</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input type="date" value={date} onChange={event => setDate(event.target.value)} className="w-full sm:w-44" />
        <Button type="button" variant="outline" onClick={openReport} disabled={loading || !date}>
          <Download className="h-4 w-4" /> {loading ? "Gerando..." : "Gerar PDF"}
        </Button>
      </div>
    </div>
  )
}

function defaultReportDate() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return toInputDate(date)
}

function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateBr(value: string) {
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year}`
}

function groupTitle(order: Order) {
  if (order.shipping?.shippingType === "station") {
    return `Entrega em Estacao - ${order.shipping.deliveryStation || "Estacao nao informada"}`
  }
  return order.shipping?.serviceName || order.shipping?.serviceId || "Frete nao informado"
}

function buildReportHtml(orders: Order[], date: string) {
  const groups = orders.reduce<Record<string, Order[]>>((acc, order) => {
    const key = groupTitle(order)
    acc[key] = [...(acc[key] || []), order]
    return acc
  }, {})

  const sections = Object.entries(groups).map(([title, groupOrders]) => `
    <section>
      <h2>${escapeHtml(title)} <span>${groupOrders.length} pedido(s)</span></h2>
      <table>
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Itens</th></tr></thead>
        <tbody>${groupOrders.map(order => orderRow(order)).join("")}</tbody>
      </table>
    </section>
  `).join("")

  return `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Separacao de pedidos - ${formatDateBr(date)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          p { margin: 0 0 20px; color: #475569; }
          button { float: right; padding: 10px 16px; border-radius: 999px; border: 1px solid #d9e2ef; background: white; font-weight: 700; cursor: pointer; }
          section { margin-top: 24px; break-inside: avoid; }
          h2 { margin: 0 0 10px; border-left: 6px solid #0f274d; padding: 8px 12px; background: #f8fafc; font-size: 16px; }
          h2 span { color: #64748b; font-size: 12px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; font-size: 13px; }
          th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
          @media print { button { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()">Imprimir / Salvar PDF</button>
        <h1>Separacao de pedidos</h1>
        <p>Data de separacao: ${formatDateBr(date)} - ${orders.length} pedido(s)</p>
        ${sections || `<section><p>Nenhum pedido pago ou em processamento para esta data.</p></section>`}
      </body>
    </html>`
}

function orderRow(order: Order) {
  const items = order.items.map(item => `${item.quantity}x ${escapeHtml(item.name)} (${escapeHtml(item.size)})`).join("<br />")
  return `<tr>
    <td>${escapeHtml(order.orderReference)}</td>
    <td>${escapeHtml(order.shipping?.recipientName || "Cliente")}</td>
    <td>${escapeHtml(deliverySummary(order))}</td>
    <td>${items}</td>
  </tr>`
}

function deliverySummary(order: Order) {
  if (order.shipping?.shippingType === "station") {
    return `${order.shipping.deliveryStation || "Estacao"} - ${order.shipping.deliveryTimeSlot || "Horario nao informado"}`
  }
  return order.shipping?.address || order.shipping?.serviceName || "Entrega nao informada"
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] || char))
}
