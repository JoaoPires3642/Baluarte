import { useState } from "react";
import { Pressable, Text, View, ScrollView } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { CheckoutScreenProps } from "./types";

export function CheckoutScreen({ user, items, subtotal, shipping, discount, total, onSetShipping, onBackCart, onGoProfile, onRequireAuth, onOrderComplete }: CheckoutScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(user?.defaultAddressId);

  const calculateShippingByCep = (cep: string): number => {
    const digits = cep.replace(/\D/g, "");
    const first = Number(digits.slice(0, 1));
    if (first <= 2) {
      return 14.9;
    }
    if (first <= 5) {
      return 19.9;
    }
    return 24.9;
  };

  const addresses = user?.addresses ?? [];
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  
  const hasValidAddress = Boolean(
    selectedAddress?.cep &&
      selectedAddress?.street &&
      selectedAddress?.number &&
      selectedAddress?.neighborhood &&
      selectedAddress?.city &&
      selectedAddress?.state
  );

  if (completed) {
    return (
      <View style={styles.stackScreen}>
        <Text style={styles.screenTitle}>Pedido Realizado!</Text>
        <Text style={styles.screenDescription}>Seu pedido foi confirmado e esta sendo processado.</Text>
        <Pressable
          style={styles.primaryActionButton}
          onPress={() => {
            setCompleted(false);
            onOrderComplete();
          }}
        >
          <Text style={styles.primaryActionButtonText}>Voltar para a loja</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBackCart}>
        <Text style={styles.backLink}>Voltar para o carrinho</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Finalizar Compra</Text>

      <View style={styles.checkoutSteps}>
        <Text style={step === 1 ? styles.stepActive : step > 1 ? styles.stepDone : styles.stepInactive}> 1 Endereco</Text>
        <Text style={step === 2 ? styles.stepActive : step > 2 ? styles.stepDone : styles.stepInactive}>2 Revisao</Text>
        <Text style={step === 3 ? styles.stepActive : styles.stepInactive}>3 Pagamento</Text>
      </View>

      {step === 1 ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Selecionar endereco</Text>
          {addresses.length > 0 ? (
            <>
              <Text style={styles.screenDescription}>Escolha o endereco para entrega</Text>
              <ScrollView style={{ maxHeight: 250, marginVertical: 12 }}>
                {addresses.map((addr) => (
                  <Pressable key={addr.id} onPress={() => setSelectedAddressId(addr.id)} style={{ marginBottom: 8 }}>
                    <View style={[styles.summaryCard, { borderWidth: selectedAddressId === addr.id ? 2 : 1, borderColor: selectedAddressId === addr.id ? "#2563eb" : "#e5e7eb" }]}>
                      <Text style={{ fontWeight: "600", fontSize: 14 }}>{addr.label}</Text>
                      <Text style={styles.screenDescription}>{addr.street}, {addr.number}</Text>
                      <Text style={styles.screenDescription}>{addr.neighborhood}, {addr.city} - {addr.state} {addr.cep}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <Text style={styles.screenDescription}>Voce nao tem enderecos cadastrados. Adicione um no seu perfil.</Text>
              <Pressable style={styles.secondaryActionButton} onPress={onGoProfile}>
                <Text style={styles.secondaryActionButtonText}>Ir para perfil</Text>
              </Pressable>
            </>
          )}

          <Pressable style={styles.secondaryActionButton} onPress={onGoProfile}>
            <Text style={styles.secondaryActionButtonText}>Gerenciar enderecos</Text>
          </Pressable>

          <Pressable
            style={styles.primaryActionButton}
            onPress={() => {
              if (!hasValidAddress) {
                setAddressError("Selecione um endereco valido");
                return;
              }
              const cep = selectedAddress?.cep ?? "";
              const nextShipping = calculateShippingByCep(cep);
              onSetShipping(nextShipping);
              setAddressError("");
              setStep(2);
            }}
          >
            <Text style={styles.primaryActionButtonText}>Calcular frete e continuar</Text>
          </Pressable>

          {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
        </View>
      ) : step === 2 ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Revisar pedido</Text>
          <Text style={styles.screenDescription}>{items.length} item(ns) no pedido</Text>

          <View style={{ marginVertical: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12 }}>
            <Text style={{ fontWeight: "600", fontSize: 14, marginBottom: 8 }}>Endereco de entrega</Text>
            {selectedAddress && (
              <>
                <Text style={styles.screenDescription}>{selectedAddress.label}</Text>
                <Text style={styles.screenDescription}>
                  {selectedAddress.street}, {selectedAddress.number}
                  {selectedAddress.complement ? ` - ${selectedAddress.complement}` : ""}
                </Text>
                <Text style={styles.screenDescription}>
                  {selectedAddress.neighborhood}, {selectedAddress.city} - {selectedAddress.state}
                </Text>
                <Text style={styles.screenDescription}>{selectedAddress.cep}</Text>
              </>
            )}
          </View>

          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryValue}>{toBrl(subtotal)}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>Desconto</Text>
            <Text style={styles.summaryValue}>-{toBrl(discount)}</Text>
          </View>
          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>Frete</Text>
            <Text style={styles.summaryValue}>{toBrl(shipping)}</Text>
          </View>
          <View style={styles.summaryLineTotal}>
            <Text style={styles.summaryTotalKey}>Total</Text>
            <Text style={styles.summaryTotalValue}>{toBrl(total)}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable style={[styles.secondaryActionButton, { flex: 1 }]} onPress={() => setStep(1)}>
              <Text style={styles.secondaryActionButtonText}>Voltar</Text>
            </Pressable>
            <Pressable style={[styles.primaryActionButton, { flex: 1 }]} onPress={() => setStep(3)}>
              <Text style={styles.primaryActionButtonText}>Confirmar e pagar</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pagamento</Text>
          <Text style={styles.screenDescription}>Escolha seu metodo de pagamento</Text>

          <Pressable style={styles.summaryCard} onPress={() => {}}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>PIX</Text>
            <Text style={styles.screenDescription}>Transferencia instantanea</Text>
          </Pressable>

          <Pressable style={styles.summaryCard} onPress={() => {}}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>Cartao de credito</Text>
            <Text style={styles.screenDescription}>Parcelado ate 12x</Text>
          </Pressable>

          <View style={styles.summaryLineTotal}>
            <Text style={styles.summaryTotalKey}>Total a pagar</Text>
            <Text style={styles.summaryTotalValue}>{toBrl(total)}</Text>
          </View>
          <Pressable
            style={styles.primaryActionButton}
            onPress={async () => {
              if (!user) {
                onRequireAuth();
                return;
              }
              setProcessing(true);
              await new Promise((resolve) => setTimeout(resolve, 1200));
              setProcessing(false);
              setCompleted(true);
              onOrderComplete();
            }}
          >
            <Text style={styles.primaryActionButtonText}>
              {processing ? "Processando..." : user ? `Confirmar pagamento de ${toBrl(total)}` : "Entrar para finalizar"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryActionButton} onPress={() => setStep(2)}>
            <Text style={styles.secondaryActionButtonText}>Voltar para revisao</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
