import { Image, Pressable, Text, View } from "react-native";

export function PaymentPixPanel({
  total,
  pix,
  loading,
  error,
  onGeneratePix,
  onCopyCode,
}: {
  total: number;
  pix: { qrCodeBase64: string; copyPasteCode: string } | null;
  loading: boolean;
  error: string;
  onGeneratePix: () => void;
  onCopyCode: () => void;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: "600", fontSize: 14 }}>Pagamento via PIX</Text>
      <Text style={{ fontSize: 14, color: "#4b5563" }}>Total: R$ {total.toFixed(2).replace(".", ",")}</Text>
      
      {pix ? (
        <>
          <Image
            source={{ uri: `data:image/png;base64,${pix.qrCodeBase64}` }}
            style={{ width: 220, height: 220, alignSelf: "center", marginTop: 12 }}
          />
          <Pressable
            style={{
              marginTop: 12,
              padding: 12,
              backgroundColor: "#f3f4f6",
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={onCopyCode}
          >
            <Text style={{ fontWeight: "600", color: "#1f2937" }}>Copiar código PIX</Text>
            <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }} numberOfLines={2}>
              {pix.copyPasteCode}
            </Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={{
            marginTop: 12,
            padding: 14,
            backgroundColor: loading ? "#9ca3af" : "#10b981",
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={onGeneratePix}
          disabled={loading}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
            {loading ? "Gerando PIX..." : "Gerar PIX"}
          </Text>
        </Pressable>
      )}
      
      {error ? (
        <Text style={{ color: "#ef4444", fontSize: 14, marginTop: 8 }}>{error}</Text>
      ) : null}
    </View>
  );
}