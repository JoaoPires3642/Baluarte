"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Shirt, Truck } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/context/toast-context"
import { fetchShippingQuotes, type ShippingQuote } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { resolveMediaUrl } from "@/lib/media"

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart()
  const { showToast } = useToast()
  const [shippingCep, setShippingCep] = useState("")
  const [shippingOptions, setShippingOptions] = useState<ShippingQuote[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState("")
  const [shippingLoading, setShippingLoading] = useState(false)

  const shipping = shippingOptions.find((option) => option.id === selectedShippingId)?.price || 0

  const handleRemove = (id: string, size: string) => {
    removeItem(id, size)
    showToast("Produto removido do carrinho", "info")
  }

  const handleIncreaseQuantity = (id: string, size: string, quantity: number, stockQuantity?: number) => {
    if (typeof stockQuantity === "number" && quantity >= stockQuantity) {
      showToast(`Estoque disponível para este tamanho: ${stockQuantity}`, "error")
      return
    }

    updateQuantity(id, size, quantity + 1)
  }

  const handleShippingSearch = async () => {
    if (shippingCep.replace(/\D/g, "").length !== 8) {
      showToast("Informe um CEP valido", "error")
      return
    }

    setShippingLoading(true)
    try {
      const digits = shippingCep.replace(/\D/g, "")
      const res = await fetchShippingQuotes({ cep: digits, street: "", number: "", neighborhood: "", city: "", state: "" }, items.length, items.some((i) => i.personalizationConfirmed))
      const options = res.data.options || []
      setShippingOptions(options)
      setSelectedShippingId(options[0]?.id || "")
      if (options.length) {
        showToast("Opcoes de frete carregadas", "success")
      } else {
        showToast("Nenhuma opcao de frete encontrada", "error")
      }
    } catch {
      showToast("Erro ao calcular frete", "error")
    }
    setShippingLoading(false)
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto space-y-4 px-4 py-8 text-center">
        <div className="surface-card mx-auto max-w-2xl rounded-[2rem] p-10">
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mt-2">Adicione produtos para continuar</p>
        <Link href="/" className="mt-4 inline-flex">
          <Button>Continuar Comprando</Button>
        </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-6 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="eyebrow">Carrinho</p>
        <h1 className="mt-4 text-3xl font-extrabold uppercase tracking-[-0.04em] text-slate-900">Resumo da compra</h1>
        <p className="mt-2 text-sm text-slate-500">Revisão clara de produtos, personalizações e frete.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const mediaUrl = resolveMediaUrl(item.image)
            const namesCount = item.customNames?.length || 0
            const numberCount = item.customNumber?.length || 0
            const namePrice = item.customNamePrice ?? 25
            const numberPrice = item.customNumberPrice ?? 25
            const basePrice = item.basePrice || item.price
            const baseLineTotal = basePrice * item.quantity
            const namesLineTotal = namesCount * namePrice * item.quantity
            const numberLineTotal = numberCount * numberPrice * item.quantity
            const lineTotal = item.price * item.quantity
            const reachedStockLimit = typeof item.stockQuantity === "number" && item.quantity >= item.stockQuantity

            return (
            <Card key={`${item.id}-${item.size}`} className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
              <CardContent className="p-4 sm:p-5">
                <div className="flex gap-3 sm:gap-4">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted sm:h-24 sm:w-24">
                    {mediaUrl ? (
                      <Image
                        src={mediaUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <Shirt className="h-10 w-10 text-[#0f274d]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.teamName || "Produto"}</p>
                        <h3 className="line-clamp-2 text-base font-bold uppercase tracking-[-0.03em] text-slate-900 sm:text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">Tam: {item.size}</p>
                        {item.customNames && item.customNames.length > 0 ? <p className="text-sm text-muted-foreground">Nomes: {item.customNames.join(", ")}</p> : null}
                        {item.customNumber ? <p className="text-sm text-muted-foreground">Numero: {item.customNumber}</p> : null}
                      </div>
                      <p className="shrink-0 text-sm font-semibold sm:text-base">R$ {item.price.toFixed(2).replace(".", ",")}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 sm:text-sm">
                      <p>Base ({item.quantity}x): R$ {baseLineTotal.toFixed(2).replace(".", ",")}</p>
                      {namesLineTotal > 0 ? <p>Nomes ({namesCount} x R$ {namePrice.toFixed(2).replace(".", ",")}): R$ {namesLineTotal.toFixed(2).replace(".", ",")}</p> : null}
                      {numberLineTotal > 0 ? <p>Número ({numberCount} x R$ {numberPrice.toFixed(2).replace(".", ",")}): R$ {numberLineTotal.toFixed(2).replace(".", ",")}</p> : null}
                      <p className="mt-1 font-semibold text-[#102a5c]">Total do item: R$ {lineTotal.toFixed(2).replace(".", ",")}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { handleIncreaseQuantity(item.id, item.size, item.quantity, item.stockQuantity); }}
                        disabled={reachedStockLimit}
                      >
                        +
                      </Button>
                      {reachedStockLimit ? <span className="text-xs font-medium text-red-600">Estoque maximo: {item.stockQuantity}</span> : null}
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-destructive sm:ml-auto"
                         onClick={() => { handleRemove(item.id, item.size); }}
                       >
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}

          <Button variant="ghost" className="w-full justify-center text-destructive" onClick={() => items.forEach((item) => removeItem(item.id, item.size))}>
            Limpar carrinho
          </Button>
        </div>

        {/* Summary */}
        <div>
          <Card className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"><Truck className="h-4 w-4 text-[#c3222a]" /> Frete por CEP</p>
                  <p className="text-xs text-slate-500">Consulte as opcoes de entrega antes de finalizar.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="CEP"
                    value={shippingCep}
                    onChange={(e) => { setShippingCep(e.target.value.replace(/\D/g, "").slice(0, 8)); }}
                  />
                  <Button onClick={handleShippingSearch} disabled={shippingLoading} className="w-full sm:w-auto">
                    {shippingLoading ? "Calculando..." : "Calcular"}
                  </Button>
                </div>

                {shippingOptions.length > 0 ? (
                  <div className="grid gap-2">
                    {shippingOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => { setSelectedShippingId(option.id); }}
                        className={`rounded-xl border p-3 text-left ${selectedShippingId === option.id ? "border-[#1e3a8a] bg-white ring-2 ring-[#1e3a8a]/10" : "border-slate-200 bg-white"}`}
                      >
                        <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                        <p className="text-sm font-extrabold text-[#102a5c]">R$ {option.price.toFixed(2).replace(".", ",")}</p>
                        <p className="text-xs text-slate-500">{option.estimatedDays}</p>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>R$ {shipping.toFixed(2).replace(".", ",")}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold sm:text-lg">
                <span>Total</span>
                <span>R$ {(total + shipping).toFixed(2).replace(".", ",")}</span>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Link href="/checkout" className="w-full">
                <Button className="w-full">Finalizar Compra</Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">Continuar Comprando</Button>
              </Link>

            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
