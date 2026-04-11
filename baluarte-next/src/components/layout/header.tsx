"use client"

import Link from "next/link"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { Heart, Search, ShieldCheck, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { SearchBox } from "@/components/search-box"

export function Header() {
  const { isSignedIn } = useUser()
  const { items } = useCart()
  const { items: wishlistItems } = useWishlist()
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#d9e2ef]/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="container mx-auto px-4 py-3">
        <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 items-center justify-between gap-3 lg:justify-start">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f274d] text-base font-black text-white shadow-lg shadow-slate-900/15 md:h-12 md:w-12 md:text-lg">
                B
              </div>
              <div className="min-w-0 leading-none">
                <div className="flex items-start gap-1">
                  <span className="truncate text-xl font-extrabold uppercase tracking-[-0.04em] text-[#10233f] md:text-2xl">Baluarte</span>
                  <span className="hidden pt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c3222a] sm:inline">BR</span>
                </div>
                <p className="hidden text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 sm:block">Artigos esportivos</p>
              </div>
            </Link>
            <Link href="/busca" className="sm:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10 border border-[#d9e2ef] bg-white text-[#0f274d]">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="order-3 lg:order-2">
            <SearchBox />
          </div>

          <div className="order-2 flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:order-3">
            <Link href="/desejos">
              <Button variant="outline" size="sm" className="h-10 border-[#d9e2ef] bg-white px-3 text-[#0f274d] sm:px-4">
                <Heart className="h-4 w-4" />
                <span className="hidden text-xs font-bold sm:inline">Favoritos</span>
                {wishlistItems.length > 0 ? <span className="text-xs font-bold">{wishlistItems.length}</span> : null}
              </Button>
            </Link>

            <Link href="/carrinho" className="relative">
              <Button variant="outline" size="sm" className="h-10 border-[#d9e2ef] bg-white px-3 font-semibold text-[#0f274d] sm:px-4">
                <ShoppingBag className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Carrinho</span>
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c3222a] p-0 text-xs text-white">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {!isSignedIn ? (
              <div className="hidden items-center gap-2 sm:flex">
                <SignInButton mode="redirect">
                  <Button variant="outline" size="sm" className="px-5">
                    Entrar
                  </Button>
                </SignInButton>
                <SignUpButton mode="redirect">
                  <Button variant="destructive" size="sm" className="px-5 shadow-md shadow-red-900/15">
                    Criar conta
                  </Button>
                </SignUpButton>
              </div>
            ) : null}

            {isSignedIn ? (
              <div className="hidden items-center gap-3 sm:flex">
                <Button variant="default" size="sm" className="px-5" asChild>
                  <Link href="/pedidos">Minha Conta</Link>
                </Button>
                <UserButton />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-3 border-t border-[#d9e2ef] pt-3">
          <nav className="flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-[#d9e2ef] bg-[#f4f7fb] p-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#c3222a] lg:inline-flex">
              <ShieldCheck className="h-4 w-4" /> Curadoria premium
            </span>
            <Link href="/categorias" className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 transition-colors hover:bg-white hover:text-[#0f274d] sm:px-4 sm:text-sm">
              Categorias
            </Link>
            <Link href="/times" className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 transition-colors hover:bg-white hover:text-[#0f274d] sm:px-4 sm:text-sm">
              Times
            </Link>
            <Link href="/selecoes" className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 transition-colors hover:bg-white hover:text-[#0f274d] sm:px-4 sm:text-sm">
              Seleções
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
