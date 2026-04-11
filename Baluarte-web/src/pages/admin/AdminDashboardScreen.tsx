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
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Dashboard</Text>
      <Text style={styles.screenDescription}>Visão geral de vendas e desempenho.</Text>

      <ScrollView style={{ marginBottom: 20 }}>
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
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#f59e0b", marginTop: 4 }}>R$ {Math.round(averagePrice)}</Text>
            <Text style={styles.screenDescription}>por produto</Text>
          </View>

          <View style={[styles.summaryCard, { flex: 1, minWidth: "45%" }]}>
            <Text style={styles.screenDescription}>Conversion rate</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#8b5cf6", marginTop: 4 }}>{conversionRate}%</Text>
            <Text style={styles.screenDescription}>ativos vs total</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.screenTitle}>Receita (últimos 7 dias)</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, height: 120, alignItems: "flex-end" }}>
            {revenueData.map((value, index) => (
              <View key={index} style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    width: "100%",
                    height: `${(value / maxRevenue) * 100}%`,
                    backgroundColor: "#10b981",
                    borderRadius: 4,
                    minHeight: 8
                  }}
                />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            {days.map((day, index) => (
              <Text key={index} style={styles.screenDescription}>{day}</Text>
            ))}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.screenTitle}>Pedidos (últimos 7 dias)</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, height: 80, alignItems: "flex-end" }}>
            {ordersData.map((value, index) => (
              <View key={index} style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    width: "100%",
                    height: `${(value / maxOrders) * 100}%`,
                    backgroundColor: "#3b82f6",
                    borderRadius: 4,
                    minHeight: 8
                  }}
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.screenTitle}>Ações Rápidas</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable style={styles.primaryActionButton} onPress={onOpenOrders}>
              <Text style={styles.primaryActionButtonText}>Ver Pedidos</Text>
            </Pressable>
            <Pressable style={styles.secondaryActionButton} onPress={onOpenProducts}>
              <Text style={styles.secondaryActionButtonText}>Gerenciar Produtos</Text>
            </Pressable>
          </View>
        </View>

        {teamSummary.length > 0 ? (
          <View style={styles.summaryCard}>
            <Text style={styles.screenTitle}>Times com mais produtos</Text>
            {teamSummary.map((entry, index) => (
              <View key={index} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
                <Text style={styles.screenDescription}>{entry.teamName}</Text>
                <Text style={{ fontWeight: "600" }}>{entry.count} produtos</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.screenDescription}>Nenhum produto carregado ainda.</Text>
        )}
        <Pressable style={styles.secondaryActionButton}>
          <Text style={styles.secondaryActionButtonText}>Ver Relatório Completo</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}