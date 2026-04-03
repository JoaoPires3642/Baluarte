import { View, Text, ScrollView } from "react-native";

import styles from "../../App.styles";
import type { Team, Product } from "../../lib/types";

type BestSellersAnalyticsProps = {
  teams: Team[];
  products: Product[];
};

export function BestSellersAnalytics({ teams, products }: BestSellersAnalyticsProps) {
  // Mock data - será substituído por API no backend
  const bestSellersByTeam = [
    { team_id: "team-1", team_name: "Flamengo", quantity: 45, revenue: 5850 },
    { team_id: "team-2", team_name: "São Paulo", quantity: 38, revenue: 4940 },
    { team_id: "team-3", team_name: "Corinthians", quantity: 35, revenue: 4550 },
    { team_id: "team-4", team_name: "Palmeiras", quantity: 28, revenue: 3640 },
    { team_id: "team-5", team_name: "Rio Branco", quantity: 22, revenue: 2860 }
  ];

  const topProductsByQuantity = [
    { product_id: "prod-1", name: "Camisa Titular 24/25", quantity: 156, revenue: 9750 },
    { product_id: "prod-2", name: "Camisa Reserva 24/25", quantity: 89, revenue: 5335 },
    { product_id: "prod-3", name: "Camisa Infantil", quantity: 72, revenue: 3600 },
    { product_id: "prod-4", name: "Camisa Goleiro", quantity: 45, revenue: 4050 },
    { product_id: "prod-5", name: "Kit com meia", quantity: 38, revenue: 2280 }
  ];

  return (
    <ScrollView>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Top Times</Text>
        <Text style={styles.screenDescription}>Camisas vendidas por time (últimos 7 dias)</Text>

        {bestSellersByTeam.map((item, idx) => (
          <View key={item.team_id} style={[styles.summaryLine, { marginTop: idx === 0 ? 12 : 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryKey}>
                {idx + 1}. {item.team_name}
              </Text>
              <Text style={styles.screenDescription}>{item.quantity} vendas</Text>
            </View>
            <Text style={[styles.summaryValue, { fontSize: 14 }]}>R$ {item.revenue.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Top Produtos</Text>
        <Text style={styles.screenDescription}>Produtos mais vendidos (últimos 7 dias)</Text>

        {topProductsByQuantity.map((item, idx) => (
          <View key={item.product_id} style={[styles.summaryLine, { marginTop: idx === 0 ? 12 : 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryKey}>
                {idx + 1}. {item.name}
              </Text>
              <Text style={styles.screenDescription}>{item.quantity} unidades</Text>
            </View>
            <Text style={[styles.summaryValue, { fontSize: 14 }]}>R$ {item.revenue.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Estatísticas Gerais</Text>

        <View style={styles.summaryLine}>
          <Text style={styles.summaryKey}>Total vendido</Text>
          <Text style={styles.summaryValue}>R$ 47.340,00</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryKey}>Unidades</Text>
          <Text style={styles.summaryValue}>465</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryKey}>Ticket médio</Text>
          <Text style={styles.summaryValue}>R$ 101,80</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryKey}>Times únicos</Text>
          <Text style={styles.summaryValue}>12</Text>
        </View>
      </View>
    </ScrollView>
  );
}
