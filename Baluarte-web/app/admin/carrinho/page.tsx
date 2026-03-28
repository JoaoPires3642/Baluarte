"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ShippingCalculator } from "@/components/shipping-calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Trash2, Plus, Minus, ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import { mockCoupons } from "@/lib/data";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    shipping,
    discount,
    total,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setShipping,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    const coupon = mockCoupons.find(
      (c) => c.code.toLowerCase() === couponCode.toLowerCase() && c.active
    );

    if (coupon) {
      if (coupon.minValue && subtotal < coupon.minValue) {
        setCouponError(
          `Valor mínimo de R$ ${coupon.minValue.toFixed(2).replace(".", ",")} para usar este cupom`
        );
        return;
      }
      applyCoupon(coupon);
      setCouponError("");
      setCouponCode("");
    } else {
      setCouponError("Cupom inválido ou expirado");
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold text-foreground">Carrinho de Compras</h1>

          {items.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">
                Seu carrinho está vazio
              </h2>
              <p className="mt-2 text-center text-muted-foreground">
                Adicione produtos ao carrinho para continuar comprando
              </p>
              <Link href="/">
                <Button className="mt-6">Continuar Comprando</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}`}
                      className="flex gap-4 rounded-lg border border-border bg-card p-4"
                    >
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {item.product.team.name}
                            </p>
                            <Link
                              href={`/produto/${item.product.id}`}
                              className="font-medium text-foreground hover:text-primary"
                            >
                              {item.product.name}
                            </Link>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Tamanho: {item.size}
                            </p>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id, item.size)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.size,
                                  item.quantity - 1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-secondary"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.size,
                                  item.quantity + 1
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-secondary"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className="font-bold text-primary">
                            R${" "}
                            {(item.product.price * item.quantity)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="mt-4 text-destructive hover:text-destructive"
                  onClick={clearCart}
                >
                  Limpar carrinho
                </Button>
              </div>

              {/* Order Summary */}
              <div className="space-y-6">
                {/* Coupon */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-foreground">
                    <Tag className="h-5 w-5" />
                    <span className="font-medium">Cupom de Desconto</span>
                  </div>
                  {appliedCoupon ? (
                    <div className="mt-3 flex items-center justify-between rounded-md bg-primary/10 p-3">
                      <div>
                        <p className="font-medium text-primary">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appliedCoupon.type === "percentage"
                            ? `${appliedCoupon.value}% de desconto`
                            : `R$ ${appliedCoupon.value.toFixed(2).replace(".", ",")} de desconto`}
                        </p>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-sm text-destructive hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite o cupom"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="bg-secondary"
                        />
                        <Button variant="secondary" onClick={handleApplyCoupon}>
                          Aplicar
                        </Button>
                      </div>
                      {couponError && (
                        <p className="mt-2 text-sm text-destructive">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Shipping */}
                <ShippingCalculator onSelectShipping={setShipping} />

                {/* Summary */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-semibold text-foreground">Resumo do Pedido</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Desconto</span>
                        <span>-R$ {discount.toFixed(2).replace(".", ",")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frete</span>
                      <span>
                        {shipping > 0
                          ? `R$ ${shipping.toFixed(2).replace(".", ",")}`
                          : "Calcule acima"}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2">
                      <div className="flex justify-between text-lg font-bold text-foreground">
                        <span>Total</span>
                        <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={shipping === 0}
                  >
                    Finalizar Compra
                  </Button>
                  {shipping === 0 && (
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Calcule o frete para continuar
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
