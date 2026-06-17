import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import { useState } from "react";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { Product } from "../../lib/types";

type BulkEditModalProps = {
  products: Product[];
  onApply: (productIds: string[], discountPercent: number) => void;
  onClose: () => void;
};

export function BulkEditModal({ products, onApply, onClose }: BulkEditModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [discountPercent, setDiscountPercent] = useState("");
  const [error, setError] = useState("");

  const handleToggleProduct = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleApply = () => {
    if (selectedIds.size === 0) {
      setError("Selecione pelo menos um produto");
      return;
    }

    const percent = parseFloat(discountPercent);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      setError("Insira um desconto válido entre 0 e 100%");
      return;
    }

    onApply(Array.from(selectedIds), percent);
  };

  const previewProducts = products.filter((p) => selectedIds.has(p.id));
  const totalAffected = selectedIds.size;

  return (
    <View style={styles.summaryCard}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={styles.summaryTitle}>Desconto em Massa</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.backLink}>✕ Fechar</Text>
        </Pressable>
      </View>

      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 12 }}>Selecione Produtos</Text>
      <ScrollView style={{ maxHeight: 200, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 8 }}>
        {products.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => handleToggleProduct(product.id)}
            style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
          >
            <View style={{ width: 20, height: 20, borderWidth: 1, borderColor: selectedIds.has(product.id) ? "#2563eb" : "#d1d5db", borderRadius: 4, justifyContent: "center", alignItems: "center", marginRight: 8, backgroundColor: selectedIds.has(product.id) ? "#2563eb" : "transparent" }}>
              {selectedIds.has(product.id) && <Text style={{ color: "white", fontWeight: "bold" }}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "500", fontSize: 13 }}>{product.name}</Text>
              <Text style={styles.screenDescription}>{toBrl(product.price)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8 }}>Desconto (%)</Text>
      <TextInput
        style={styles.formInput}
        placeholder="Ex: 15 para 15% de desconto"
        placeholderTextColor="#9ca3af"
        keyboardType="decimal-pad"
        value={discountPercent}
        onChangeText={(text) => {
          setDiscountPercent(text);
          setError("");
        }}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {totalAffected > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: "#eff6ff", marginTop: 12 }]}>
          <Text style={{ fontWeight: "600", fontSize: 13, marginBottom: 4 }}>Preview ({totalAffected} produtos)</Text>
          {previewProducts.slice(0, 3).map((p) => {
            const percent = parseFloat(discountPercent) || 0;
            const discount = (p.price * percent) / 100;
            const newPrice = p.price - discount;
            return (
              <Text key={p.id} style={styles.screenDescription}>
                {p.name}: {toBrl(p.price)} → {toBrl(newPrice)}
              </Text>
            );
          })}
          {totalAffected > 3 && <Text style={styles.screenDescription}>... e mais {totalAffected - 3}</Text>}
        </View>
      )}

      <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
        <Pressable style={[styles.secondaryActionButton, { flex: 1 }]} onPress={onClose}>
          <Text style={styles.secondaryActionButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryActionButton, { flex: 1 }]}
          onPress={handleApply}
          disabled={selectedIds.size === 0 || !discountPercent}
        >
          <Text style={styles.primaryActionButtonText}>Aplicar ({totalAffected})</Text>
        </Pressable>
      </View>
    </View>
  );
}
