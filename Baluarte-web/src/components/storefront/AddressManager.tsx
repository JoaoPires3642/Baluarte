import { useState } from "react";
import { Pressable, Text, TextInput, View, ScrollView } from "react-native";

import styles from "../../App.styles";
import { useViaCep } from "../../hooks/useViaCep";
import type { Address } from "../../lib/types";

type AddressManagerProps = {
  addresses: Address[];
  defaultAddressId?: string;
  onAddAddress: (address: Address) => void;
  onUpdateAddress: (address: Address) => void;
  onDeleteAddress: (id: string) => void;
  onSetDefault: (id: string) => void;
};

export function AddressManager({
  addresses,
  defaultAddressId,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onSetDefault
}: AddressManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Address>({
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    label: "Principal"
  });
  const { fetchAddressByCep, loading: cepLoading, error: cepError } = useViaCep();
  const [message, setMessage] = useState("");

  const handleCepBlur = async () => {
    const result = await fetchAddressByCep(formData.cep);
    if (result) {
      setFormData((prev) => ({
        ...prev,
        ...result
      }));
    }
  };

  const handleSave = () => {
    if (!formData.cep || !formData.street || !formData.number || !formData.neighborhood || !formData.city || !formData.state) {
      setMessage("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingId) {
      onUpdateAddress({ ...formData, id: editingId });
      setMessage("Endereço atualizado");
    } else {
      const newId = `addr-${Date.now()}`;
      onAddAddress({ ...formData, id: newId });
      setMessage("Endereço adicionado");
    }

    setTimeout(() => {
      setShowForm(false);
      setEditingId(null);
      setFormData({ cep: "", street: "", number: "", neighborhood: "", city: "", state: "", label: "Principal" });
      setMessage("");
    }, 1000);
  };

  const handleEdit = (address: Address) => {
    setFormData(address);
    setEditingId(address.id ?? null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <View style={styles.summaryCard}>
        <Pressable onPress={() => setShowForm(false)}>
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>
        <Text style={styles.summaryTitle}>{editingId ? "Editar" : "Novo"} Endereço</Text>

        <TextInput
          style={styles.formInput}
          value={formData.label}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, label: value }))}
          placeholder="Label (ex: Casa, Trabalho)"
          placeholderTextColor="#9ca3af"
        />

        <TextInput
          style={styles.formInput}
          value={formData.cep}
          onChangeText={(value) => {
            const digits = value.replace(/\D/g, "").slice(0, 8);
            const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
            setFormData((prev) => ({ ...prev, cep: formatted }));
          }}
          placeholder="CEP"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
          onBlur={handleCepBlur}
        />
        {cepLoading && <Text style={styles.screenDescription}>Buscando CEP...</Text>}
        {cepError && <Text style={styles.errorText}>{cepError}</Text>}

        <TextInput
          style={styles.formInput}
          value={formData.street}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, street: value }))}
          placeholder="Rua"
          placeholderTextColor="#9ca3af"
        />

        <TextInput
          style={styles.formInput}
          value={formData.number}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, number: value }))}
          placeholder="Número"
          placeholderTextColor="#9ca3af"
        />

        <TextInput
          style={styles.formInput}
          value={formData.complement}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, complement: value }))}
          placeholder="Complemento (opcional)"
          placeholderTextColor="#9ca3af"
        />

        <TextInput
          style={styles.formInput}
          value={formData.neighborhood}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, neighborhood: value }))}
          placeholder="Bairro"
          placeholderTextColor="#9ca3af"
        />

        <TextInput
          style={styles.formInput}
          value={formData.city}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, city: value }))}
          placeholder="Cidade"
          placeholderTextColor="#9ca3af"
        />

        <TextInput
          style={styles.formInput}
          value={formData.state}
          onChangeText={(value) => setFormData((prev) => ({ ...prev, state: value.toUpperCase().slice(0, 2) }))}
          placeholder="UF"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          maxLength={2}
        />

        <Pressable style={styles.primaryActionButton} onPress={handleSave}>
          <Text style={styles.primaryActionButtonText}>{editingId ? "Atualizar" : "Adicionar"} Endereço</Text>
        </Pressable>

        {message ? <Text style={message.includes("erro") || message.includes("Preencha") ? styles.errorText : styles.screenDescription}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Meus Endereços</Text>

        <ScrollView style={{ maxHeight: 300 }}>
          {addresses.map((addr) => (
            <View key={addr.id} style={[styles.summaryCard, { marginTop: 12, marginBottom: 12 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "600", fontSize: 14 }}>{addr.label}</Text>
                {addr.id === defaultAddressId && <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "600" }}>PADRÃO</Text>}
              </View>

              <Text style={styles.screenDescription}>
                {addr.street}, {addr.number}
                {addr.complement ? ` - ${addr.complement}` : ""}
              </Text>
              <Text style={styles.screenDescription}>
                {addr.neighborhood}, {addr.city} - {addr.state} {addr.cep}
              </Text>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                {addr.id !== defaultAddressId && (
                  <Pressable style={[styles.secondaryActionButton, { flex: 1 }]} onPress={() => onSetDefault(addr.id ?? "")}>
                    <Text style={styles.secondaryActionButtonText}>Usar</Text>
                  </Pressable>
                )}
                <Pressable style={[styles.secondaryActionButton, { flex: 1 }]} onPress={() => handleEdit(addr)}>
                  <Text style={styles.secondaryActionButtonText}>Editar</Text>
                </Pressable>
                <Pressable
                  style={[styles.secondaryActionButton, { flex: 1, borderColor: "#dc2626" }]}
                  onPress={() => {
                    if (addr.id !== defaultAddressId) {
                      onDeleteAddress(addr.id ?? "");
                    }
                  }}
                >
                  <Text style={[styles.secondaryActionButtonText, { color: addr.id !== defaultAddressId ? "#dc2626" : "#9ca3af" }]}>Deletar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        <Pressable style={styles.primaryActionButton} onPress={() => setShowForm(true)}>
          <Text style={styles.primaryActionButtonText}>+ Novo Endereço</Text>
        </Pressable>
      </View>
    </View>
  );
}
