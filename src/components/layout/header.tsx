"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { Heart, Menu, ShieldCheck, ShoppingBag, UserRound, X } from "lucide-react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { SearchBox } from "@/components/search-box"

export function Header() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const { items } = useCart()
  const { items: wishlistItems } = useWishlist()
  const { status } = useSession()
  const isLoaded = status !== "loading"
  const isSignedIn = status === "authenticated"
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const [compactMobileHeader, setCompactMobileHeader] = useState(false)
  const [compactTabletHeader, setCompactTabletHeader] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const updateHeaderState = () => {
      const width = window.innerWidth
      const isMobile = width < 640
      const isTablet = width >= 640 && width < 1024
      const shouldCompact = window.scrollY > 56

      setCompactMobileHeader(isMobile && shouldCompact)
      setCompactTabletHeader(isTablet && shouldCompact)
    }

    updateHeaderState()
    window.addEventListener("scroll", updateHeaderState, { passive: true })
    window.addEventListener("resize", updateHeaderState)

    return () => {
      window.removeEventListener("scroll", updateHeaderState)
      window.removeEventListener("resize", updateHeaderState)
    }
  }, [])

  return (
    <header className="sticky top-0 z-[90] w-full border-b border-[#d9e2ef]/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className={`container mx-auto px-4 transition-all duration-200 ${compactMobileHeader ? "py-2" : compactTabletHeader ? "py-2.5" : "py-3"}`}>
        <div className="mb-3 flex items-center gap-1 sm:hidden">
          <Link href="/" className="flex shrink-0 items-center">
            <div className={`relative shrink-0 overflow-hidden transition-all duration-300 ${compactMobileHeader ? "h-8 w-20" : "h-9 w-22"}`}>
              <Image src="/logoN.png" alt="Baluarte" fill priority sizes="88px" className="object-contain object-left" />
            </div>
          </Link>
          <div className="min-w-0 flex-1">
            <SearchBox className="relative w-full" inputClassName="h-10 w-full rounded-full border-[#d9e2ef] bg-white pl-9 pr-2 shadow-sm" />
          </div>
          <button type="button" onClick={() => { setMobileMenuOpen(true); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d9e2ef] bg-white text-[#0f274d] shadow-sm">
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <div className="hidden min-w-0 items-center justify-between gap-3 sm:flex lg:justify-start">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className={`relative shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/10 transition-all duration-200 ${compactMobileHeader ? "h-9 w-9" : compactTabletHeader ? "h-10 w-10" : "h-11 w-11"} md:h-12 md:w-12 lg:h-11 lg:w-11 xl:h-12 xl:w-12`}>
                <Image src="/logoN.png" alt="Baluarte" fill priority sizes="48px" className="object-contain p-1" />
              </div>
              <div className={`min-w-0 leading-none transition-all duration-200 ${compactMobileHeader ? "hidden" : "block"}`}>
                <div className="flex items-start gap-1">
                  <span className="truncate text-xl font-extrabold uppercase tracking-[-0.04em] text-[#10233f] md:text-2xl">Baluarte</span>
                  <span className="hidden pt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c3222a] sm:inline">BR</span>
                </div>
                <p className="hidden text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 sm:block">Artigos esportivos</p>
              </div>
            </Link>
          </div>

          <div className={`order-3 hidden lg:order-2 sm:block ${compactMobileHeader ? "col-span-full" : compactTabletHeader ? "sm:col-span-full" : ""}`}>
            <SearchBox />
          </div>

          <div className={`order-2 shrink-0 items-center justify-end gap-2 sm:gap-3 lg:order-3 ${compactMobileHeader ? "hidden" : compactTabletHeader ? "flex" : "hidden sm:flex"}`}>
            <Link href="/desejos">
              <Button variant="outline" size="sm" className="h-10 border-[#d9e2ef] bg-white px-3 text-[#0f274d] sm:px-4">
                <Heart className="h-4 w-4" />
                <span className={`hidden text-xs font-bold ${compactTabletHeader ? "lg:inline" : "sm:inline"}`}>Favoritos</span>
                {wishlistItems.length > 0 ? <span className="text-xs font-bold">{wishlistItems.length}</span> : null}
              </Button>
            </Link>

            <Link href="/carrinho" className="relative">
              <Button variant="outline" size="sm" className="h-10 border-[#d9e2ef] bg-white px-3 font-semibold text-[#0f274d] sm:px-4">
                <ShoppingBag className={`h-4 w-4 ${compactTabletHeader ? "sm:block lg:hidden" : "sm:hidden"}`} />
                <span className={`${compactTabletHeader ? "hidden lg:inline" : "hidden sm:inline"}`}>Carrinho</span>
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c3222a] p-0 text-xs text-white">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            <div className={`items-center gap-2 ${compactTabletHeader ? "hidden lg:flex" : "hidden sm:flex"}`}>
              {(!isLoaded || !isSignedIn) ? (
                <>
                <Button variant="outline" size="sm" className="px-5" asChild>
                  <Link href="/sign-in">Entrar</Link>
                </Button>
                <Button variant="destructive" size="sm" className="px-5 shadow-md shadow-red-900/15" asChild>
                  <Link href="/sign-up">Criar conta</Link>
                </Button>
                </>
              ) : (
                <>
                <Button variant="outline" size="sm" className="px-5" asChild>
                  <Link href="/conta">Minha conta</Link>
                </Button>
                <Button variant="outline" size="sm" className="px-3" onClick={() => signOut()}>Sair</Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-3 border-t border-[#d9e2ef] pt-3 transition-all duration-200 ${compactMobileHeader ? "hidden" : compactTabletHeader ? "hidden lg:block" : "block"}`}>
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

      {isClient ? createPortal(
        <div className={`fixed inset-0 z-[200] transition-all duration-300 sm:hidden ${mobileMenuOpen ? "pointer-events-auto bg-slate-950/55 backdrop-blur-sm" : "pointer-events-none bg-transparent"}`}>
          <button type="button" aria-label="Fechar menu" onClick={() => { setMobileMenuOpen(false); }} className="absolute inset-0" />
          <div className={`ml-auto flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-center justify-between border-b border-[#d9e2ef] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-24 overflow-hidden">
                  <Image src="/logoN.png" alt="Baluarte" fill priority sizes="96px" className="object-contain object-left" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">artigos esportivos</p>
                </div>
              </div>
              <button type="button" onClick={() => { setMobileMenuOpen(false); }} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto px-4 py-5">
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Navegação</p>
                <div className="grid gap-2">
                  <Link href="/categorias" onClick={() => { setMobileMenuOpen(false); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-[#10233f]">Categorias</Link>
                  <Link href="/times" onClick={() => { setMobileMenuOpen(false); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-[#10233f]">Times</Link>
                  <Link href="/selecoes" onClick={() => setMobileMenuOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-[#10233f]">Seleções</Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Atalhos</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/desejos" onClick={() => { setMobileMenuOpen(false); }} className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-4 text-center text-sm font-semibold text-[#10233f]">
                    <Heart className="mx-auto mb-2 h-5 w-5 text-[#c3222a]" /> Favoritos
                  </Link>
                  <Link href="/carrinho" onClick={() => { setMobileMenuOpen(false); }} className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-4 text-center text-sm font-semibold text-[#10233f]">
                    <ShoppingBag className="mx-auto mb-2 h-5 w-5 text-[#0f274d]" /> Carrinho
                  </Link>
                  <Link href="/pedidos" onClick={() => { setMobileMenuOpen(false); }} className="rounded-2xl border border-slate-200 bg-[#f8fbff] p-4 text-center text-sm font-semibold text-[#10233f]">
                    <UserRound className="mx-auto mb-2 h-5 w-5 text-[#0f274d]" /> Pedidos
                  </Link>
                </div>
              </div>

              <div className="grid gap-2">
                {(!isLoaded || !isSignedIn) ? (
                  <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/sign-in" onClick={() => { setMobileMenuOpen(false); }}>Entrar</Link>
                  </Button>
                  <Button variant="destructive" className="w-full" asChild>
                    <Link href="/sign-up" onClick={() => { setMobileMenuOpen(false); }}>Criar conta</Link>
                  </Button>
                  </>
                ) : (
                  <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/conta" onClick={() => { setMobileMenuOpen(false); }}>Minha conta</Link>
                  </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </header>
  )
}
