import { View, Text } from "react-native";

import styles from "../../App.styles";
import type { Order } from "../../lib/types";

type OrderTimelineProps = {
  order: Order;
};

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  aguardando_pagamento: { label: "Aguardando pagamento", color: "#dc2626", icon: "💳" },
  pronto_envio: { label: "Preparando pedido", color: "#f59e0b", icon: "📦" },
  enviado: { label: "Pedido enviado", color: "#3b82f6", icon: "🚚" },
  entregue: { label: "Pedido entregue", color: "#22c55e", icon: "✅" }
};

export function OrderTimeline({ order }: OrderTimelineProps) {
  const statusSequence: Array<keyof typeof statusConfig> = ["aguardando_pagamento", "pronto_envio", "enviado", "entregue"];
  const currentStatusIndex = statusSequence.indexOf(order.status as keyof typeof statusConfig);

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Status do pedido</Text>
      <View style={{ marginVertical: 12 }}>
        {statusSequence.map((status, index) => {
          const config = statusConfig[status];
          const isCompleted = index < currentStatusIndex;
          const isCurrent = index === currentStatusIndex;

          return (
            <View key={status}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isCompleted || isCurrent ? config.color : "#e5e7eb",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{config.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: isCurrent ? "700" : "500", fontSize: 14 }}>{config.label}</Text>
                  {isCurrent && <Text style={styles.screenDescription}>Estado atual</Text>}
                </View>
              </View>

              {index < statusSequence.length - 1 && (
                <View
                  style={{
                    marginLeft: 20,
                    height: 20,
                    width: 2,
                    backgroundColor: isCompleted ? statusConfig[statusSequence[index + 1]].color : "#e5e7eb",
                    marginBottom: 0
                  }}
                />
              )}
            </View>
          );
        })}
      </View>

      {order.status === "entregue" && (
        <Text style={styles.screenDescription}>Pedido entregue com sucesso! Obrigado pela compra.</Text>
      )}
      {order.status === "aguardando_pagamento" && (
        <Text style={styles.screenDescription}>Complete o pagamento para que o pedido seja confirmado.</Text>
      )}
      {order.status === "pronto_envio" && (
        <Text style={styles.screenDescription}>Seu pedido esta sendo preparado e sera enviado em breve.</Text>
      )}
      {order.status === "enviado" && (
        <Text style={styles.screenDescription}>O pedido esta a caminho. Voce recebeao codigo de rastreamento em breve.</Text>
      )}
    </View>
  );
}
