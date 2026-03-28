"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockOrders } from "@/lib/data";
import { Order } from "@/lib/types";
import {
  Search,
  Clock,
  Package,
  Truck,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Printer,
  Copy,
} from "lucide-react";

const statusLabels: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  aguardando_pagamento: {
    label: "Aguardando Pagamento",
    color: "text-primary",
    bgColor: "bg-primary/10",
    icon: Clock,
  },
  pronto_envio: {
    label: "Pronto para Envio",
    color: "text-foreground",
    bgColor: "bg-secondary",
    icon: Package,
  },
  enviado: {
    label: "Enviado",
    color: "text-primary",
    bgColor: "bg-primary/10",
    icon: Truck,
  },
  entregue: {
    label: "Entregue",
    color: "text-foreground",
    bgColor: "bg-secondary",
    icon: CheckCircle,
  },
};

const statusOrder = ["aguardando_pagamento", "pronto_envio", "enviado", "entregue"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState<string | null>(null);
  const [generatedLabels, setGeneratedLabels] = useState<Record<string, string>>({});

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const getNextStatus = (currentStatus: Order["status"]): Order["status"] | null => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex < statusOrder.length - 1) {
      return statusOrder[currentIndex + 1] as Order["status"];
    }
    return null;
  };

  const generateLabel = async (orderId: string) => {
    setGeneratingLabel(orderId);
    // Simular geração de etiqueta
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const trackingCode = `BR${Math.random().toString(36).substring(2, 8).toUpperCase()}${Date.now().toString().slice(-6)}`;
    setGeneratedLabels((prev) => ({ ...prev, [orderId]: trackingCode }));
    setGeneratingLabel(null);
  };

  const copyTrackingCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground lg:text-2xl">Pedidos</h1>
      <p className="mt-1 text-sm text-muted-foreground lg:text-base">
        Gerencie os pedidos da sua loja
      </p>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 lg:mt-6 lg:flex-row lg:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-secondary pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
            className="shrink-0"
          >
            Todos
          </Button>
          {Object.entries(statusLabels).map(([key, status]) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(key)}
              className="shrink-0 whitespace-nowrap"
            >
              <span className="hidden sm:inline">{status.label}</span>
              <span className="sm:hidden">
                {status.label.split(" ")[0]}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="mt-4 space-y-3 lg:mt-6 lg:space-y-4">
        {filteredOrders.map((order) => {
          const status = statusLabels[order.status];
          const StatusIcon = status.icon;
          const nextStatus = getNextStatus(order.status);
          const isExpanded = expandedOrder === order.id;
          const hasLabel = generatedLabels[order.id];
          const isGenerating = generatingLabel === order.id;

          return (
            <Card key={order.id} className="border-border bg-card">
              <CardContent className="p-3 lg:p-4">
                {/* Order Header - Mobile */}
                <div className="flex flex-col gap-3 lg:hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedOrder(isExpanded ? null : order.id)
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                      <div>
                        <span className="text-sm font-bold text-foreground">{order.id}</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      R$ {order.total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-center gap-2 rounded-full px-3 py-1.5 ${status.bgColor}`}
                  >
                    <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    <span className={`text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Order Header - Desktop */}
                <div className="hidden items-center justify-between lg:flex">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : order.id)
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    <div>
                      <span className="font-bold text-foreground">{order.id}</span>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center gap-2 rounded-full px-3 py-1 ${status.bgColor}`}
                    >
                      <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <span className="font-bold text-foreground">
                      R$ {order.total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 border-t border-border pt-4">
                    {/* Items */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Itens</h4>
                      {order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex flex-col gap-1 rounded-md bg-secondary p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tamanho: {item.size} | Qtd: {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            R${" "}
                            {(item.product.price * item.quantity)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-foreground">
                        Endereço de Entrega
                      </h4>
                      <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
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

                    {/* Tracking Code (if generated) */}
                    {hasLabel && (
                      <div className="mt-4 rounded-md bg-primary/10 p-3">
                        <h4 className="text-sm font-medium text-foreground">
                          Código de Rastreio
                        </h4>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="flex-1 rounded bg-secondary px-2 py-1 text-sm font-mono text-foreground">
                            {hasLabel}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyTrackingCode(hasLabel)}
                            className="shrink-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      {/* Generate Label Button - only for "pronto_envio" */}
                      {order.status === "pronto_envio" && !hasLabel && (
                        <Button
                          variant="outline"
                          onClick={() => generateLabel(order.id)}
                          disabled={isGenerating}
                          className="w-full sm:w-auto"
                        >
                          {isGenerating ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Printer className="mr-2 h-4 w-4" />
                              Gerar Etiqueta
                            </>
                          )}
                        </Button>
                      )}

                      {/* Next Status Button */}
                      {nextStatus && (
                        <Button
                          onClick={() =>
                            updateOrderStatus(order.id, nextStatus as Order["status"])
                          }
                          className="w-full sm:w-auto"
                          disabled={order.status === "pronto_envio" && !hasLabel}
                        >
                          Marcar como {statusLabels[nextStatus].label}
                        </Button>
                      )}
                    </div>

                    {/* Help text for pronto_envio without label */}
                    {order.status === "pronto_envio" && !hasLabel && (
                      <p className="mt-2 text-center text-xs text-muted-foreground sm:text-right">
                        Gere a etiqueta antes de marcar como enviado
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
