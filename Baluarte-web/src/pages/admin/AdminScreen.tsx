import { Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { AdminScreenProps } from "./types";

export function AdminScreen({
  user,
  orders,
  productsCount,
  onBack,
  onLogin,
  onOpenDashboard,
  onOpenCategories,
  onOpenTeams,
  onOpenProducts,
  onOpenOrders,
  onOpenCoupons
}: AdminScreenProps) {
  if (!user || user.role !== "admin") {
    return (
      <View style={styles.stackScreen}>
        <Text style={styles.screenTitle}>Area Admin</Text>
        <Text style={styles.screenDescription}>Login admin necessario.</Text>
        <Pressable style={styles.primaryActionButton} onPress={onLogin}>
          <Text style={styles.primaryActionButtonText}>Entrar como admin</Text>
        </Pressable>
      </View>
    );
  }

  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const pendingPayment = orders.filter((order) => order.status === "aguardando_pagamento").length;
  const readyToShip = orders.filter((order) => order.status === "pronto_envio").length;

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>

      <View style={styles.adminHeroCard}>
        <Text style={styles.adminHeroTitle}>Painel administrativo</Text>
        <Text style={styles.adminHeroSubtitle}>Gerencie catalogo, pedidos e cupons em um unico lugar.</Text>
      </View>

      <View style={styles.adminKpiGrid}>
        <View style={styles.adminKpiCard}>
          <Text style={styles.adminKpiLabel}>Pedidos</Text>
          <Text style={styles.adminKpiValue}>{orders.length}</Text>
        </View>
        <View style={styles.adminKpiCard}>
          <Text style={styles.adminKpiLabel}>Receita</Text>
          <Text style={styles.adminKpiValue}>{toBrl(revenue)}</Text>
        </View>
        <View style={styles.adminKpiCard}>
          <Text style={styles.adminKpiLabel}>Aguardando pagamento</Text>
          <Text style={styles.adminKpiValue}>{pendingPayment}</Text>
        </View>
        <View style={styles.adminKpiCard}>
          <Text style={styles.adminKpiLabel}>Prontos para envio</Text>
          <Text style={styles.adminKpiValue}>{readyToShip}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.adminSectionTitle}>Atalhos de gestao</Text>
        <View style={styles.adminMenuList}>
          <Pressable style={styles.adminMenuButton} onPress={onOpenDashboard}>
            <Text style={styles.adminMenuButtonText}>📊 Dashboard</Text>
            <Text style={styles.adminMenuButtonMeta}>Gráficos e análises em tempo real</Text>
          </Pressable>
          <Pressable style={styles.adminMenuButton} onPress={onOpenOrders}>
            <Text style={styles.adminMenuButtonText}>Pedidos</Text>
            <Text style={styles.adminMenuButtonMeta}>Atualizar status e etiqueta</Text>
          </Pressable>
          <Pressable style={styles.adminMenuButton} onPress={onOpenCategories}>
            <Text style={styles.adminMenuButtonText}>Categorias</Text>
            <Text style={styles.adminMenuButtonMeta}>Organizar estrutura da loja</Text>
          </Pressable>
          <Pressable style={styles.adminMenuButton} onPress={onOpenTeams}>
            <Text style={styles.adminMenuButtonText}>Times</Text>
            <Text style={styles.adminMenuButtonMeta}>Manter clubes e ligas</Text>
          </Pressable>
          <Pressable style={styles.adminMenuButton} onPress={onOpenProducts}>
            <Text style={styles.adminMenuButtonText}>Produtos</Text>
            <Text style={styles.adminMenuButtonMeta}>Cadastro e estoque</Text>
          </Pressable>
          <Pressable style={styles.adminMenuButton} onPress={onOpenCoupons}>
            <Text style={styles.adminMenuButtonText}>Cupons</Text>
            <Text style={styles.adminMenuButtonMeta}>Promocoes e descontos</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryLine}><Text style={styles.summaryKey}>Produtos ativos</Text><Text style={styles.summaryValue}>{productsCount}</Text></View>
      </View>
    </View>
  );
}
