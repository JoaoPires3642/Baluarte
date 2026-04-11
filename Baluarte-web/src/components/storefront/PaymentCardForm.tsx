import { Pressable, Text, TextInput, View } from "react-native";
import { useState } from "react";

export function PaymentCardForm({
  loading,
  error,
  installments,
  selectedInstallments,
  onSelectInstallments,
  onSubmit,
}: {
  loading: boolean;
  error: string;
  installments: number[];
  selectedInstallments: number;
  onSelectInstallments: (value: number) => void;
  onSubmit: (payload: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
    cpf: string;
  }) => void;
}) {
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");

  const handleSubmit = () => {
    onSubmit({
      number,
      holderName,
      expirationMonth,
      expirationYear,
      cvv,
      cpf,
    });
  };

  return (
    <View style={{ marginTop: 12 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
          fontSize: 16,
        }}
        placeholder="Número do cartão"
        value={number}
        onChangeText={setNumber}
        keyboardType="number-pad"
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
          fontSize: 16,
        }}
        placeholder="Nome impresso no cartão"
        value={holderName}
        onChangeText={setHolderName}
      />
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
          }}
          placeholder="MM"
          value={expirationMonth}
          onChangeText={setExpirationMonth}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
          }}
          placeholder="AA"
          value={expirationYear}
          onChangeText={setExpirationYear}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
          }}
          placeholder="CVV"
          value={cvv}
          onChangeText={setCvv}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
        />
      </View>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: "#d1d5db",
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          fontSize: 16,
        }}
        placeholder="CPF do titular"
        value={cpf}
        onChangeText={setCpf}
        keyboardType="number-pad"
      />

      <Text style={{ fontWeight: "600", fontSize: 14, marginBottom: 8 }}>Parcelas</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {installments.map((option) => (
          <Pressable
            key={option}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              borderWidth: selectedInstallments === option ? 2 : 1,
              borderColor: selectedInstallments === option ? "#2563eb" : "#d1d5db",
              backgroundColor: selectedInstallments === option ? "#eff6ff" : "transparent",
            }}
            onPress={() => onSelectInstallments(option)}
          >
            <Text
              style={{
                fontWeight: selectedInstallments === option ? "700" : "500",
                color: selectedInstallments === option ? "#2563eb" : "#374151",
              }}
            >
              {option}x sem juros
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={{
          padding: 14,
          backgroundColor: loading ? "#9ca3af" : "#2563eb",
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          {loading ? "Processando cartão..." : "Pagar com cartão"}
        </Text>
      </Pressable>

      {error ? (
        <Text style={{ color: "#ef4444", fontSize: 14, marginTop: 8 }}>{error}</Text>
      ) : null}
    </View>
  );
}