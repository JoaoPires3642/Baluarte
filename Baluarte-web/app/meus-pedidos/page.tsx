"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { mockOrders } from "@/lib/data";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  ChevronRight,
  ShoppingBag,
  Copy,
  ArrowLeft,
} from "lucide-react";

const statusLabels: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }>; step: number }
> = {
  aguardando_pagamento: {
    label: "Aguardando Pagamento",
    color: "text-primary",
    bgColor: "bg-primary/10",
    icon: Clock,
    step: 1,
  },
  pronto_envio: {
    label: "Pronto para Envio",
    color: "text-foreground",
    bgColor: "bg-secondary",
    icon: Package,
    step: 2,
  },
  enviado: {
    label: "Enviado",
    color: "text-primary",
    bgColor: "bg-primary/10",
    icon: Truck,
    step: 3,
  },
  entregue: {
    label: "Entregue",
    color: "text-foreground",
    bgColor: "bg-secondary",
    icon: CheckCircle,
    step: 4,
  },
};

const statusSteps = [
  { key: "aguardando_pagamento", label: "Pagamento", icon: Clock },
  { key: "pronto_envio", label: "Preparação", icon: Package },
  { key: "enviado", label: "Enviado", icon: Truck },
  { key: "entregue", label: "Entregue", icon: CheckCircle },
];

export default function MyOrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/meus-pedidos");
    }
  }, [isAuthenticated, router]);

  // Filtrar pedidos do usuário (mock - mostrando todos)
  const userOrders = mockOrders;

  const copyTrackingCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para a loja
            </Link>
            <h1 className="text-xl font-bold text-foreground lg:text-2xl">
              Meus Pedidos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe o status dos seus pedidos
            </p>
          </div>

          {/* Orders List */}
          {userOrders.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                <h2 className="mt-4 text-lg font-medium text-foreground">
                  Nenhum pedido encontrado
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Você ainda não fez nenhum pedido.
                </p>
                <Link href="/">
                  <Button className="mt-4">Começar a comprar</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userOrders.map((order) => {
                const status = statusLabels[order.status];
                const StatusIcon = status.icon;
                const currentStep = status.step;
                // Mock tracking code for orders that are "enviado" or "entregue"
                const trackingCode =
                  order.status === "enviado" || order.status === "entregue"
                    ? `BR${order.id.slice(-6).toUpperCase()}${Date.now().toString().slice(-4)}`
                    : null;

                return (
                  <Card key={order.id} className="border-border bg-card overflow-hidden">
                    <CardContent className="p-0">
                      {/* Order Header */}
                      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              Pedido {order.id}
                            </span>
                            <div
                              className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${status.bgColor}`}
                            >
                              <StatusIcon className={`h-3 w-3 ${status.color}`} />
                              <span className={`text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-foreground">
                          R$ {order.total.toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      {/* Status Timeline */}
                      <div className="border-b border-border bg-secondary/30 p-4">
                        <div className="flex items-center justify-between">
                          {statusSteps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = currentStep > index + 1;
                            const isCurrent = currentStep === index + 1;

                            return (
                              <div key={step.key} className="flex flex-1 items-center">
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 ${
                                      isCompleted
                                        ? "bg-green-500 text-white"
                                        : isCurrent
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                  </div>
                                  <span
                                    className={`mt-1 text-[10px] sm:text-xs ${
                                      isCompleted || isCurrent
                                        ? "font-medium text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {step.label}
                                  </span>
                                </div>
                                {index < statusSteps.length - 1 && (
                                  <div
                                    className={`mx-1 h-0.5 flex-1 sm:mx-2 ${
                                      isCompleted ? "bg-green-500" : "bg-muted"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tracking Code (if available) */}
                      {trackingCode && (
                        <div className="border-b border-border bg-primary/5 p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Código de Rastreio
                              </p>
                              <code className="text-sm font-mono font-medium text-foreground">
                                {trackingCode}
                              </code>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyTrackingCode(trackingCode)}
                              className="w-full sm:w-auto"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar código
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Order Items */}
                      <div className="p-4">
                        <h4 className="mb-3 text-sm font-medium text-foreground">
                          Itens do pedido
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 rounded-md bg-secondary p-3"
                            >
                              <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {item.product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Tamanho: {item.size} | Qtd: {item.quantity}
                                </p>
                              </div>
                              <span className="shrink-0 text-sm font-medium text-foreground">
                                R${" "}
                                {(item.product.price * item.quantity)
                                  .toFixed(2)
                                  .replace(".", ",")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div className="border-t border-border p-4">
                        <h4 className="mb-2 text-sm font-medium text-foreground">
                          Endereço de entrega
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {order.shippingAddress.street},{" "}
                          {order.shippingAddress.number}
                          {order.shippingAddress.complement &&
                            ` - ${order.shippingAddress.complement}`}
                          <br />
                          {order.shippingAddress.neighborhood} -{" "}
                          {order.shippingAddress.city}/{order.shippingAddress.state}
                          <br />
                          CEP: {order.shippingAddress.cep}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
