import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";

import styles from "../../App.styles";

type AdminDashboardScreenProps = {
  onBack: () => void;
  onOpenOrders: () => void;
  onOpenProducts: () => void;
};

export function AdminDashboardScreen({ onBack, onOpenOrders, onOpenProducts }: AdminDashboardScreenProps) {
  // Mock data - será substituído por APIs no backend
  const kpis = {
    totalRevenue: 12450.75,
    totalOrders: 47,
    conversionRate: 3.2,
    avgOrderValue: 265 
  };

  const revenueData = [800, 1200, 950, 1800, 2100, 1650, 900];
  const ordersData = [3, 5, 4, 8, 9, 7, 4];
  const maxRevenue = Math.max(...revenueData);
  const maxOrders = Math.max(...ordersData);
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Dashboard</Text>
      <Text style={styles.screenDescription}>Visão geral de vendas e desempenho.</Text>

      <ScrollView style={{ marginBottom: 20 }}>
        {/* KPI Cards */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <View style={[styles.summaryCard, { flex: 1, minWidth: "45%" }]}>
            <Text style={styles.screenDescription}>Receita Total</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#10b981", marginTop: 4 }}>R$ {kpis.totalRevenue.toFixed(2)}</Text>
            <Text style={styles.screenDescription}>últimos 7 dias</Text>
          </View>

          <View style={[styles.summaryCard, { flex: 1, minWidth: "45%" }]}>
            <Text style={styles.screenDescription}>Pedidos</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#3b82f6", marginTop: 4 }}>{kpis.totalOrders}</Text>
            <Text style={styles.screenDescription}>últimos 7 dias</Text>
          </View>

          <View style={[styles.summaryCard, { flex: 1, minWidth: "45%" }]}>
            <Text style={styles.screenDescription}>Ticket Médio</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#8b5cf6", marginTop: 4 }}>R$ {kpis.avgOrderValue.toFixed(2)}</Text>
            <Text style={styles.screenDescription}>por pedido</Text>
          </View>

          <View style={[styles.summaryCard, { flex: 1, minWidth: "45%" }]}>
            <Text style={styles.screenDescription}>Taxa Conversão</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#f59e0b", marginTop: 4 }}>{kpis.conversionRate.toFixed(1)}%</Text>
            <Text style={styles.screenDescription}>de visitantes</Text>
          </View>
        </View>

        {/* Revenue Chart (Simple bar visualization) */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Receita (últimos 7 dias)</Text>
          <View style={{ marginVertical: 12, gap: 8 }}>
            {revenueData.map((value, idx) => (
              <View key={idx}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>{days[idx]}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#2563eb" }}>R$ {value.toFixed(2)}</Text>
                </View>
                <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      width: `${(value / maxRevenue) * 100}%`,
                      backgroundColor: "#2563eb",
                      borderRadius: 3
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Orders Chart */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pedidos (últimos 7 dias)</Text>
          <View style={{ marginVertical: 12, gap: 8 }}>
            {ordersData.map((value, idx) => (
              <View key={idx}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>{days[idx]}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#3b82f6" }}>{value} pedidos</Text>
                </View>
                <View style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      width: `${(value / maxOrders) * 100}%`,
                      backgroundColor: "#3b82f6",
                      borderRadius: 3
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Ações Rápidas</Text>
          <Pressable style={styles.primaryActionButton} onPress={onOpenOrders}>
            <Text style={styles.primaryActionButtonText}>Ver Pedidos</Text>
          </Pressable>
          <Pressable style={styles.secondaryActionButton} onPress={onOpenProducts}>
            <Text style={styles.secondaryActionButtonText}>Gerenciar Produtos</Text>
          </Pressable>
        </View>

        {/* Best Sellers Preview */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Top Times</Text>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>1. Flamengo</Text>
            <Text style={styles.summaryValue}>45 vendas</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>2. São Paulo</Text>
            <Text style={styles.summaryValue}>38 vendas</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>3. Corinthians</Text>
            <Text style={styles.summaryValue}>35 vendas</Text>
          </View>
          <Pressable style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionButtonText}>Ver Relatório Completo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
