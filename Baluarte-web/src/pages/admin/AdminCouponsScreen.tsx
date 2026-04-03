import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import { AdminBlockedScreen } from "./AdminBlockedScreen";
import type { AdminCouponsScreenProps } from "./types";

export function AdminCouponsScreen({ user, coupons, onBack, onUpdateCoupons }: AdminCouponsScreenProps) {
  const [newCode, setNewCode] = useState("");
  const [newValue, setNewValue] = useState("10");

  if (!user || user.role !== "admin") {
    return <AdminBlockedScreen onBack={onBack} message="Acesso admin necessario para cupons." />;
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>Voltar ao dashboard</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Cupons</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Novo cupom</Text>
        <TextInput style={styles.formInput} value={newCode} onChangeText={setNewCode} placeholder="CODIGO" placeholderTextColor="#9ca3af" autoCapitalize="characters" />
        <TextInput style={styles.formInput} value={newValue} onChangeText={setNewValue} placeholder="Valor %" placeholderTextColor="#9ca3af" keyboardType="number-pad" />
        <Pressable
          style={styles.primaryActionButton}
          onPress={() => {
            const code = newCode.trim().toUpperCase();
            const value = Number(newValue);
            if (!code || !Number.isFinite(value) || value <= 0) {
              Alert.alert("Cupom invalido", "Informe codigo e valor validos.");
              return;
            }
            if (coupons.some((coupon) => coupon.code === code)) {
              Alert.alert("Cupom existente", "Este codigo ja existe.");
              return;
            }
            onUpdateCoupons([
              {
                id: `cup-${Date.now()}`,
                code,
                type: "percentage",
                value,
                active: true
              },
              ...coupons
            ]);
            setNewCode("");
          }}
        >
          <Text style={styles.primaryActionButtonText}>Adicionar cupom</Text>
        </Pressable>
      </View>

      {coupons.map((coupon) => (
        <View key={coupon.id} style={styles.summaryCard}>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryTitle}>{coupon.code}</Text>
            <Text style={styles.summaryValue}>{coupon.type === "percentage" ? `${coupon.value}%` : toBrl(coupon.value)}</Text>
          </View>
          <Pressable
            style={coupon.active ? styles.secondaryActionButton : styles.primaryActionButton}
            onPress={() => onUpdateCoupons(coupons.map((item) => (item.id === coupon.id ? { ...item, active: !item.active } : item)))}
          >
            <Text style={coupon.active ? styles.secondaryActionButtonText : styles.primaryActionButtonText}>{coupon.active ? "Desativar" : "Ativar"}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}
