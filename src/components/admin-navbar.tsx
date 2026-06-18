"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Package, ShoppingCart, FolderTree, Users, ChevronDown, Truck, Train, Phone, LogOut } from "lucide-react"
import { useState } from "react"

const PRIMARY_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { href: "/admin/times", label: "Times", icon: Users },
]

const SETTINGS_NAV_ITEMS = [
  { href: "/admin/frete", label: "Frete", icon: Truck },
  { href: "/admin/estacoes", label: "Estacoes", icon: Train },
  { href: "/admin/contato", label: "Contato", icon: Phone },
]

export function AdminNavbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f274d] text-xs font-bold text-white">
              B
            </div>
            <span className="hidden text-sm font-bold uppercase tracking-wider text-[#0f274d] sm:inline">
              Admin
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {PRIMARY_NAV_ITEMS.map(item => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#0f274d] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <span className="mx-2 h-6 w-px bg-slate-200" aria-hidden="true" />
            {SETTINGS_NAV_ITEMS.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#0f274d] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-xs text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline sm:inline"
          >
            Ver loja
          </Link>
          <button
            onClick={() => { signOut({ callbackUrl: "/" }); }}
            className="hidden items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 sm:flex"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
          <button
            onClick={() => { setMobileOpen(!mobileOpen); }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 md:hidden"
          >
            <span className="text-xs font-medium">Menu</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-2 md:hidden">
          <nav className="flex flex-col gap-1">
            {PRIMARY_NAV_ITEMS.map(item => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setMobileOpen(false); }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#0f274d] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <span className="my-1 h-px bg-slate-100" aria-hidden="true" />
            {SETTINGS_NAV_ITEMS.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#0f274d] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              Ver loja
            </Link>
            <button
              onClick={() => { signOut({ callbackUrl: "/" }); }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
