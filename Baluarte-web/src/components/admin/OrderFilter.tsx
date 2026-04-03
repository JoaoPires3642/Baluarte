import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";

import styles from "../../App.styles";

export type OrderFilterOptions = {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
};

type OrderFilterProps = {
  onApplyFilter: (filters: OrderFilterOptions) => void;
  onReset: () => void;
};

const statusOptions = ["todos", "aguardando_pagamento", "pronto_envio", "enviado", "entregue"];

export function OrderFilter({ onApplyFilter, onReset }: OrderFilterProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchText, setSearchText] = useState("");

  const handleApply = () => {
    const filters: OrderFilterOptions = {
      status: selectedStatus === "todos" ? undefined : selectedStatus,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      searchText: searchText || undefined
    };
    onApplyFilter(filters);
    setShowFilter(false);
  };

  const handleReset = () => {
    setSelectedStatus("todos");
    setDateFrom("");
    setDateTo("");
    setSearchText("");
    onReset();
    setShowFilter(false);
  };

  const statusLabels: Record<string, string> = {
    todos: "Todos",
    aguardando_pagamento: "Aguardando Pagamento",
    pronto_envio: "Preparando",
    enviado: "Enviado",
    entregue: "Entregue"
  };

  if (!showFilter) {
    return (
      <Pressable style={styles.secondaryActionButton} onPress={() => setShowFilter(true)}>
        <Text style={styles.secondaryActionButtonText}>🔍 Filtros ({[selectedStatus !== "todos", dateFrom || dateTo, searchText].filter(Boolean).length})</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.summaryCard}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={styles.summaryTitle}>Filtrar Pedidos</Text>
        <Pressable onPress={() => setShowFilter(false)}>
          <Text style={styles.backLink}>✕ Fechar</Text>
        </Pressable>
      </View>

      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 12 }}>Status</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {statusOptions.map((status) => (
          <Pressable
            key={status}
            onPress={() => setSelectedStatus(status)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: selectedStatus === status ? "#2563eb" : "#e5e7eb",
              backgroundColor: selectedStatus === status ? "#dbeafe" : "transparent"
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: selectedStatus === status ? "600" : "400", color: selectedStatus === status ? "#2563eb" : "#6b7280" }}>
              {statusLabels[status]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8 }}>Período</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        <TextInput
          style={[styles.formInput, { flex: 1 }]}
          placeholder="De (YYYY-MM-DD)"
          placeholderTextColor="#9ca3af"
          value={dateFrom}
          onChangeText={setDateFrom}
        />
        <TextInput
          style={[styles.formInput, { flex: 1 }]}
          placeholder="Até (YYYY-MM-DD)"
          placeholderTextColor="#9ca3af"
          value={dateTo}
          onChangeText={setDateTo}
        />
      </View>

      <Text style={{ fontSize: 13, fontWeight: "600", marginBottom: 8 }}>Buscar</Text>
      <TextInput
        style={styles.formInput}
        placeholder="ID do pedido, email, nome..."
        placeholderTextColor="#9ca3af"
        value={searchText}
        onChangeText={setSearchText}
      />

      <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
        <Pressable style={[styles.secondaryActionButton, { flex: 1 }]} onPress={handleReset}>
          <Text style={styles.secondaryActionButtonText}>Limpar</Text>
        </Pressable>
        <Pressable style={[styles.primaryActionButton, { flex: 1 }]} onPress={handleApply}>
          <Text style={styles.primaryActionButtonText}>Aplicar</Text>
        </Pressable>
      </View>
    </View>
  );
}
