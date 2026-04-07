import { View, Text, ScrollView, Pressable } from "react-native";

import styles from "../../App.styles";
import type { AdminProduct } from "./types";

type AdminDashboardScreenProps = {
  onBack: () => void;
  onOpenOrders: () => void;
  onOpenProducts: () => void;
  products: AdminProduct[];
};

export function AdminDashboardScreen({ onBack, onOpenOrders, onOpenProducts, products }: AdminDashboardScreenProps) {
  const activeProducts = products.filter((product) => product.active);
  const totalInventoryUnits = activeProducts.reduce((sum, product) => sum + product.stockQuantity, 0);
  const averagePrice = activeProducts.length > 0 ? activeProducts.reduce((sum, product) => sum + product.price, 0) / activeProducts.length : 0;
  const conversionRate = products.length > 0 ? Math.min(100, Math.round((activeProducts.length / products.length) * 100)) : 0;

  const teamSummary = Object.values(
    products.reduce<Record<string, { teamName: string; count: number }>>((accumulator, product) => {
      const entry = accumulator[product.teamId] ?? { teamName: product.team?.name ?? product.teamId, count: 0 };
      accumulator[product.teamId] = {
        teamName: product.team?.name ?? entry.teamName,
        count: entry.count + 1
      };
      return accumulator;
    }, {})
  )
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

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
            <Text style={styles.screenDescription}>Produtos ativos</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#10b981", marginTop: 4 }}>{activeProducts.length}</Text>
            <Text style={styles.screenDescription}>itens carregados do banco</Text>
          </View>

          <View style={[styles.summaryCard, { flex: 1, minWidth: "45%" }]}>
            <Text style={styles.screenDescription}>Estoque total</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#3b82f6", marginTop: 4 }}>{totalInventoryUnits}</Text>
            <Text style={styles.screenDescription}>unidades disponíveis</Text>
          </View>

          <View style={[styles.summaryCard, { flex: 1, minWidth: "45%" }]}>
            <Text style={styles.screenDescription}>Preço médio</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#8b5cf6", marginTop: 4 }}>R$ {averagePrice.toFixed(2)}</Text>
            <Text style={styles.screenDescription}>por produto</Text>
          </View>

          <View style={[styles.summaryCard, { flex: 1, minWidth: "45%" }]}>
            <Text style={styles.screenDescription}>Ativos publicados</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#f59e0b", marginTop: 4 }}>{conversionRate}%</Text>
            <Text style={styles.screenDescription}>do catálogo interno</Text>
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
          <Text style={styles.summaryTitle}>Times com mais produtos</Text>
          {teamSummary.length > 0 ? (
            teamSummary.map((item, index) => (
              <View key={item.teamName} style={styles.summaryLine}>
                <Text style={styles.summaryKey}>{index + 1}. {item.teamName}</Text>
                <Text style={styles.summaryValue}>{item.count} produtos</Text>
              </View>
            ))
          ) : (
            <Text style={styles.screenDescription}>Nenhum produto carregado ainda.</Text>
          )}
          <Pressable style={styles.secondaryActionButton}>
            <Text style={styles.secondaryActionButtonText}>Ver Relatório Completo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
