"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, ShieldCheck } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/categoria/nacionais", label: "Nacionais" },
  { href: "/categoria/internacionais", label: "Internacionais" },
  { href: "/categoria/selecoes", label: "Selecoes" },
];

export function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary shadow-sm">
            <span className="text-sm font-black text-primary-foreground">B</span>
          </div>
          <div className="leading-none">
            <p className="text-lg font-black tracking-tight text-foreground uppercase">Baluarte</p>
            <p className="text-[9px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Artigos Esportivos
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <Link href="/carrinho" aria-label="Ir para carrinho">
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {itemCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/meus-pedidos" className="hidden text-sm font-semibold text-foreground hover:text-primary sm:inline-flex">
                Olá, {user?.name.split(" ")[0]}
              </Link>
            </>
          )}

          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={logout}>
              Sair
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm" className="gap-1">
                <User className="h-4 w-4" />
                Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
