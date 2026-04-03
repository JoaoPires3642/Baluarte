import { useState } from "react";
import { Alert, Pressable, Text, View, ScrollView } from "react-native";

import styles from "../../App.styles";
import { OrderFilter, type OrderFilterOptions } from "../../components/admin/OrderFilter";
import { toBrl } from "../../lib/format";
import { AdminBlockedScreen } from "./AdminBlockedScreen";
import type { AdminOrdersScreenProps } from "./types";

export function AdminOrdersScreen({ user, orders, onBack, onUpdateOrders }: AdminOrdersScreenProps) {
  const [filters, setFilters] = useState<OrderFilterOptions | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const orderFlow = ["aguardando_pagamento", "pronto_envio", "enviado", "entregue"] as const;

  if (!user || user.role !== "admin") {
    return <AdminBlockedScreen onBack={onBack} message="Acesso admin necessario para pedidos." />;
  }

  const filtered = orders.filter((order) => {
    // Filter by status
    if (filters?.status && order.status !== filters.status) {
      return false;
    }

    // Filter by date range (mock - seria feito com parse real no backend)
    if (filters?.dateFrom || filters?.dateTo) {
      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
      if (filters.dateFrom && orderDate < filters.dateFrom) return false;
      if (filters.dateTo && orderDate > filters.dateTo) return false;
    }

    // Filter by search text
    if (filters?.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesId = order.id.toLowerCase().includes(searchLower);
      const matchesEmail = order.email?.toLowerCase().includes(searchLower) ?? false;
      if (!matchesId && !matchesEmail) return false;
    }

    return true;
  });

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar ao dashboard</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Pedidos</Text>
      <Text style={styles.screenDescription}>{filtered.length} pedido(s) encontrado(s)</Text>

      <OrderFilter onApplyFilter={setFilters} onReset={() => setFilters(null)} />

      <ScrollView>

      {filtered.map((order) => {
        const step = orderFlow.indexOf(order.status);
        const next = step >= 0 && step < orderFlow.length - 1 ? orderFlow[step + 1] : null;
        return (
          <View key={order.id} style={styles.summaryCard}>
            <View style={styles.summaryLine}>
              <Text style={styles.summaryTitle}>{order.id}</Text>
              <Text style={styles.summaryValue}>{toBrl(order.total)}</Text>
            </View>
            <Text style={styles.screenDescription}>Status: {order.status}</Text>
            {labels[order.id] ? <Text style={styles.screenDescription}>Etiqueta: {labels[order.id]}</Text> : null}

            <View style={styles.inlineActionRow}>
              {order.status === "pronto_envio" && !labels[order.id] ? (
                <Pressable
                  style={styles.secondaryActionButton}
                  onPress={() => {
                    const tracking = `BR${Math.random().toString(36).slice(2, 8).toUpperCase()}${Date.now().toString().slice(-5)}`;
                    setLabels((prev) => ({ ...prev, [order.id]: tracking }));
                  }}
                >
                  <Text style={styles.secondaryActionButtonText}>Gerar etiqueta</Text>
                </Pressable>
              ) : null}

              {next ? (
                <Pressable
                  style={styles.primaryActionButton}
                  onPress={() => {
                    if (order.status === "pronto_envio" && !labels[order.id]) {
                      Alert.alert("Etiqueta obrigatoria", "Gere a etiqueta antes de marcar como enviado.");
                      return;
                    }
                    onUpdateOrders(orders.map((item) => (item.id === order.id ? { ...item, status: next } : item)));
                  }}
                >
                  <Text style={styles.primaryActionButtonText}>Marcar {next}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
      </ScrollView>
    </View>
  );
}
