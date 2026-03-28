"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOrders, products, mockCoupons } from "@/lib/data";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle,
} from "lucide-react";

const stats = [
  {
    title: "Pedidos Hoje",
    value: "12",
    change: "+20%",
    icon: ShoppingCart,
  },
  {
    title: "Receita do Mês",
    value: "R$ 45.231,89",
    change: "+15%",
    icon: DollarSign,
  },
  {
    title: "Produtos Ativos",
    value: products.length.toString(),
    change: "+3",
    icon: Package,
  },
  {
    title: "Taxa de Conversão",
    value: "3.2%",
    change: "+0.5%",
    icon: TrendingUp,
  },
];

const statusLabels: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "text-primary", icon: Clock },
  pronto_envio: { label: "Pronto para Envio", color: "text-foreground", icon: Package },
  enviado: { label: "Enviado", color: "text-primary", icon: Truck },
  entregue: { label: "Entregue", color: "text-foreground", icon: CheckCircle },
};

export default function AdminDashboard() {
  const recentOrders = mockOrders.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Visão geral do seu e-commerce
      </p>

      {/* Stats Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-primary">{stat.change} vs. mês anterior</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground">Pedidos Recentes</h2>
        <Card className="mt-4 border-border bg-card">
          <CardContent className="p-0">
            <div className="md:hidden">
              {recentOrders.map((order) => {
                const status = statusLabels[order.status];
                const StatusIcon = status.icon;

                return (
                  <div key={order.id} className="border-b border-border p-4 last:border-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium text-foreground">{order.id}</span>
                      <span className="text-right font-semibold text-foreground">
                        R$ {order.total.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <div className={`mt-2 flex items-center gap-2 ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm">{status.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <table className="hidden w-full md:table">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const status = statusLabels[order.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{order.id}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-2 ${status.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          <span className="text-sm">{status.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        R$ {order.total.toFixed(2).replace(".", ",")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Orders by Status */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Pedidos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statusLabels).map(([key, status]) => {
                const count = mockOrders.filter((o) => o.status === key).length;
                const StatusIcon = status.icon;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm">{status.label}</span>
                    </div>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active Coupons */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Cupons Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCoupons.filter((c) => c.active).map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between rounded-md bg-secondary p-3"
                >
                  <div>
                    <span className="font-mono font-bold text-primary">
                      {coupon.code}
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {coupon.type === "percentage"
                        ? `${coupon.value}% de desconto`
                        : `R$ ${coupon.value.toFixed(2).replace(".", ",")} de desconto`}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
