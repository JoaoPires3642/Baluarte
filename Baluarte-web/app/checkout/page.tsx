"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Check, CreditCard, Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const { items, subtotal, shipping, discount, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const [address, setAddress] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const [payment, setPayment] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });

  if (!isAuthenticated) {
    router.push("/login?redirect=/checkout");
    return null;
  }

  if (items.length === 0 && !orderComplete) {
    router.push("/carrinho");
    return null;
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setLoading(false);
    setOrderComplete(true);
    clearCart();
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const groups = numbers.match(/.{1,4}/g) || [];
    return groups.join(" ").substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length >= 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
    }
    return numbers;
  };

  if (orderComplete) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Check className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-foreground">
              Pedido Realizado!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Seu pedido foi confirmado e está sendo processado. Você receberá um
              email com os detalhes.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Número do pedido: <strong>#ORD-{Date.now().toString().slice(-6)}</strong>
            </p>
            <Link href="/">
              <Button className="mt-6">Voltar para a Loja</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold text-foreground">Finalizar Compra</h1>

          {/* Steps */}
          <div className="mt-6 flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                  }`}
              >
                {step > 1 ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <span className="text-sm font-medium">Endereço</span>
            </div>
            <div className="h-px flex-1 bg-border" />
            <div
              className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step >= 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                  }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Pagamento</span>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2">
              {step === 1 && (
                <form
                  onSubmit={handleAddressSubmit}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <h2 className="text-lg font-semibold text-foreground">
                    Endereço de Entrega
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground">
                        CEP
                      </label>
                      <Input
                        value={address.cep}
                        onChange={(e) =>
                          setAddress({ ...address, cep: e.target.value })
                        }
                        placeholder="00000-000"
                        className="mt-1 bg-secondary"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground">
                        Rua
                      </label>
                      <Input
                        value={address.street}
                        onChange={(e) =>
                          setAddress({ ...address, street: e.target.value })
                        }
                        placeholder="Nome da rua"
                        className="mt-1 bg-secondary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Número
                      </label>
                      <Input
                        value={address.number}
                        onChange={(e) =>
                          setAddress({ ...address, number: e.target.value })
                        }
                        placeholder="123"
                        className="mt-1 bg-secondary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Complemento
                      </label>
                      <Input
                        value={address.complement}
                        onChange={(e) =>
                          setAddress({ ...address, complement: e.target.value })
                        }
                        placeholder="Apto, Bloco..."
                        className="mt-1 bg-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Bairro
                      </label>
                      <Input
                        value={address.neighborhood}
                        onChange={(e) =>
                          setAddress({ ...address, neighborhood: e.target.value })
                        }
                        placeholder="Bairro"
                        className="mt-1 bg-secondary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Cidade
                      </label>
                      <Input
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        placeholder="Cidade"
                        className="mt-1 bg-secondary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Estado
                      </label>
                      <Input
                        value={address.state}
                        onChange={(e) =>
                          setAddress({ ...address, state: e.target.value })
                        }
                        placeholder="UF"
                        className="mt-1 bg-secondary"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="mt-6 w-full">
                    Continuar para Pagamento
                  </Button>
                </form>
              )}

              {step === 2 && (
                <form
                  onSubmit={handlePaymentSubmit}
                  className="rounded-lg border border-border bg-card p-6"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Dados do Cartão
                    </h2>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Número do Cartão
                      </label>
                      <Input
                        value={payment.cardNumber}
                        onChange={(e) =>
                          setPayment({
                            ...payment,
                            cardNumber: formatCardNumber(e.target.value),
                          })
                        }
                        placeholder="0000 0000 0000 0000"
                        className="mt-1 bg-secondary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Nome no Cartão
                      </label>
                      <Input
                        value={payment.cardName}
                        onChange={(e) =>
                          setPayment({ ...payment, cardName: e.target.value })
                        }
                        placeholder="Nome como está no cartão"
                        className="mt-1 bg-secondary"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Validade
                        </label>
                        <Input
                          value={payment.expiry}
                          onChange={(e) =>
                            setPayment({
                              ...payment,
                              expiry: formatExpiry(e.target.value),
                            })
                          }
                          placeholder="MM/AA"
                          className="mt-1 bg-secondary"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          CVV
                        </label>
                        <Input
                          value={payment.cvv}
                          onChange={(e) =>
                            setPayment({
                              ...payment,
                              cvv: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          placeholder="123"
                          className="mt-1 bg-secondary"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        `Pagar R$ ${total.toFixed(2).replace(".", ",")}`
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Order Summary */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Resumo do Pedido</h3>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="flex gap-3"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-secondary">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tam: {item.size} | Qtd: {item.quantity}
                      </p>
                      <p className="text-sm font-bold text-primary">
                        R${" "}
                        {(item.product.price * item.quantity)
                          .toFixed(2)
                          .replace(".", ",")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
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
                  <span>R$ {shipping.toFixed(2).replace(".", ",")}</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
