import { useState } from "react";
import { Pressable, Text, View, ScrollView } from "react-native";

import styles from "../../App.styles";
import { OrderTimeline } from "../../components/storefront/OrderTimeline";
import { toBrl } from "../../lib/format";
import type { OrdersScreenProps } from "./types";

export function OrdersScreen({ user, orders, onBack, onLogin }: OrdersScreenProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orders.length > 0 ? orders[0].id : null);

  if (!user) {
    return (
      <View style={styles.stackScreen}>
        <Text style={styles.screenTitle}>Acesso restrito</Text>
        <Text style={styles.screenDescription}>Faca login para ver seus pedidos.</Text>
        <Pressable style={styles.primaryActionButton} onPress={onLogin}>
          <Text style={styles.primaryActionButtonText}>Ir para login</Text>
        </Pressable>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.stackScreen}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Meus Pedidos</Text>
        <Text style={styles.screenDescription}>Voce ainda nao tem pedidos.</Text>
      </View>
    );
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Meus Pedidos</Text>
      <Text style={styles.screenDescription}>Acompanhe o status dos seus pedidos.</Text>

      <ScrollView>
        {orders.map((order) => (
          <Pressable key={order.id} onPress={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryTitle}>{order.id}</Text>
                <Text style={styles.summaryValue}>{toBrl(order.total)}</Text>
              </View>
              <Text style={styles.screenDescription}>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</Text>
              <Text style={styles.screenDescription}>Status: {order.status}</Text>
              <Text style={{ fontSize: 12, color: "#2563eb", marginTop: 8 }}>{expandedOrderId === order.id ? "▼ Ocultar detalhes" : "► Mostrtar detalhes"}</Text>
            </View>

            {expandedOrderId === order.id && <OrderTimeline order={order} />}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
