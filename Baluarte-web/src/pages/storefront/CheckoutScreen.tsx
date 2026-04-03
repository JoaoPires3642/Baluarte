import { useEffect, useState } from "react";
import { Pressable, Text, View, ScrollView, TextInput } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { Address } from "../../lib/types";
import type { CheckoutScreenProps } from "./types";

const EMPTY_GUEST_ADDRESS: Address = {
  cep: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: ""
};

function isAddressValid(address?: Address | null): boolean {
  const normalizedCep = address?.cep?.replace(/\D/g, "") ?? "";
  return Boolean(
    normalizedCep.length === 8 &&
      address?.street?.trim() &&
      address?.number?.trim() &&
      address?.neighborhood?.trim() &&
      address?.city?.trim() &&
      address?.state?.trim()
  );
}

export function CheckoutScreen({
  user,
  items,
  subtotal,
  shipping,
  discount,
  total,
  initialStep = 1,
  initialSelectedAddressId,
  guestAddressDraft = null,
  onCheckoutContextChange,
  onSetShipping,
  onBackCart,
  onGoProfile,
  onRequireAuth,
  onOrderComplete
}: CheckoutScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(
    initialSelectedAddressId ?? (isAddressValid(guestAddressDraft) ? undefined : user?.defaultAddressId)
  );
  const [guestAddress, setGuestAddress] = useState<Address>(guestAddressDraft ?? EMPTY_GUEST_ADDRESS);

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

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    if (initialSelectedAddressId) {
      setSelectedAddressId(initialSelectedAddressId);
      return;
    }
    if (isAddressValid(guestAddressDraft)) {
      setSelectedAddressId(undefined);
      return;
    }
    if (!selectedAddressId && user?.defaultAddressId && !isAddressValid(guestAddressDraft)) {
      setSelectedAddressId(user.defaultAddressId);
    }
  }, [guestAddressDraft, initialSelectedAddressId, selectedAddressId, user?.defaultAddressId]);

  useEffect(() => {
    if (guestAddressDraft) {
      setGuestAddress(guestAddressDraft);
    }
  }, [guestAddressDraft]);

  useEffect(() => {
    onCheckoutContextChange?.({
      step,
      selectedAddressId,
      guestAddressDraft: isAddressValid(guestAddress) ? guestAddress : null
    });
  }, [guestAddress, onCheckoutContextChange, selectedAddressId, step]);

  const addresses = user?.addresses ?? [];
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const effectiveAddress = selectedAddress ?? guestAddress;
  const hasValidAddress = isAddressValid(effectiveAddress);

  if (completed) {
    return (
      <View style={styles.stackScreen}>
        <Text style={styles.screenTitle}>Pedido Realizado!</Text>
        <Text style={styles.screenDescription}>Seu pedido foi confirmado e esta sendo processado.</Text>
        <Pressable
          style={styles.primaryActionButton}
          onPress={() => {
            setCompleted(false);
            onOrderComplete(effectiveAddress);
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
              <Text style={styles.screenDescription}>Preencha seu endereco para continuar sem login.</Text>
              <TextInput
                style={styles.formInput}
                value={guestAddress.cep}
                onChangeText={(value) => setGuestAddress((prev) => ({ ...prev, cep: value }))}
                placeholder="CEP"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.formInput}
                value={guestAddress.street}
                onChangeText={(value) => setGuestAddress((prev) => ({ ...prev, street: value }))}
                placeholder="Rua"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.formInput}
                value={guestAddress.number}
                onChangeText={(value) => setGuestAddress((prev) => ({ ...prev, number: value }))}
                placeholder="Numero"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.formInput}
                value={guestAddress.neighborhood}
                onChangeText={(value) => setGuestAddress((prev) => ({ ...prev, neighborhood: value }))}
                placeholder="Bairro"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.formInput}
                value={guestAddress.city}
                onChangeText={(value) => setGuestAddress((prev) => ({ ...prev, city: value }))}
                placeholder="Cidade"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={styles.formInput}
                value={guestAddress.state}
                onChangeText={(value) => setGuestAddress((prev) => ({ ...prev, state: value }))}
                placeholder="UF"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
            </>
          )}

          {user ? (
            <Pressable style={styles.secondaryActionButton} onPress={onGoProfile}>
              <Text style={styles.secondaryActionButtonText}>Gerenciar enderecos</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={styles.primaryActionButton}
            onPress={() => {
              if (!hasValidAddress) {
                setAddressError("Selecione um endereco valido");
                return;
              }
              const cep = effectiveAddress?.cep ?? "";
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
            {effectiveAddress && (
              <>
                <Text style={styles.screenDescription}>{effectiveAddress.label ?? "Endereco informado"}</Text>
                <Text style={styles.screenDescription}>
                  {effectiveAddress.street}, {effectiveAddress.number}
                  {effectiveAddress.complement ? ` - ${effectiveAddress.complement}` : ""}
                </Text>
                <Text style={styles.screenDescription}>
                  {effectiveAddress.neighborhood}, {effectiveAddress.city} - {effectiveAddress.state}
                </Text>
                <Text style={styles.screenDescription}>{effectiveAddress.cep}</Text>
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
              onOrderComplete(effectiveAddress);
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
