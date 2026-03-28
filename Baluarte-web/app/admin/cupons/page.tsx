"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockCoupons } from "@/lib/data";
import { Coupon } from "@/lib/types";
import { Plus, Tag } from "lucide-react";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(mockCoupons);
  const [newCode, setNewCode] = useState("");
  const [newValue, setNewValue] = useState("");

  const activeCount = useMemo(() => coupons.filter((c) => c.active).length, [coupons]);

  const addCoupon = () => {
    const code = newCode.trim().toUpperCase();
    const value = Number(newValue);

    if (!code || Number.isNaN(value) || value <= 0) {
      return;
    }

    const alreadyExists = coupons.some((c) => c.code === code);
    if (alreadyExists) {
      return;
    }

    const created: Coupon = {
      id: `cup-${Date.now()}`,
      code,
      type: "percentage",
      value,
      active: true,
    };

    setCoupons((prev) => [created, ...prev]);
    setNewCode("");
    setNewValue("");
  };

  const toggleCoupon = (id: string) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground lg:text-2xl">Cupons</h1>
      <p className="mt-1 text-sm text-muted-foreground lg:text-base">
        Gerencie descontos ativos da loja
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle>Novo cupom</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="CODIGO"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <Input
              placeholder="% desconto"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value.replace(/\D/g, ""))}
            />
            <Button onClick={addCoupon} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total de cupons</p>
            <p className="text-2xl font-bold text-foreground">{coupons.length}</p>
            <p className="mt-3 text-sm text-muted-foreground">Ativos</p>
            <p className="text-2xl font-bold text-primary">{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Lista de cupons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-sm font-bold text-foreground">{coupon.code}</p>
                <p className="text-xs text-muted-foreground">
                  {coupon.type === "percentage"
                    ? `${coupon.value}% de desconto`
                    : `R$ ${coupon.value.toFixed(2).replace(".", ",")} de desconto`}
                </p>
              </div>

              <Button
                variant={coupon.active ? "outline" : "default"}
                size="sm"
                onClick={() => toggleCoupon(coupon.id)}
              >
                {coupon.active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          ))}

          {coupons.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum cupom cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
