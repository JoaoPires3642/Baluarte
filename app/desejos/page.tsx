"use client"

import Link from "next/link"
import { Heart, Shirt, Trash2 } from "lucide-react"
import { useWishlist } from "@/context/wishlist-context"
import { useToast } from "@/context/toast-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function WishlistPage() {
  const { items, removeItem } = useWishlist()
  const { showToast } = useToast()

  const handleRemove = (name: string) => {
    removeItem(name)
    showToast("Produto removido da lista de desejos", "info")
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center space-y-4">
        <div className="surface-card mx-auto max-w-2xl rounded-[2rem] p-10">
        <Heart className="mx-auto h-10 w-10 text-[#c3222a]" />
        <h1 className="mt-4 text-2xl font-bold">Sua lista de desejos está vazia</h1>
        <p className="text-muted-foreground">Adicione produtos para salvar para depois</p>
        <Link href="/">
          <Button>Explorar Produtos</Button>
        </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-[2rem] border border-[#d9e2ef] bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8">
        <p className="eyebrow">Favoritos</p>
        <h1 className="mt-4 text-2xl font-bold">Lista de Desejos</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-square bg-muted flex items-center justify-center">
              <Shirt className="h-12 w-12 text-[#0f274d]" />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold line-clamp-2">{item.name}</h3>
              <p className="font-bold text-lg mt-2">
                R$ {item.price.toFixed(2).replace(".", ",")}
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1">Adicionar ao Carrinho</Button>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
