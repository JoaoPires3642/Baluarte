import { useEffect, useState } from "react";
import { Pressable, Text, View, ScrollView, TextInput } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { Address } from "../../lib/types";
import type { ShippingQuoteOptionDto } from "../../lib/mobile/api/contracts";
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

function CheckoutStepAddress({
  user,
  addresses,
  needsSavedAddressFromProfile,
  selectedAddressId,
  setSelectedAddressId,
  guestAddress,
  setGuestAddress,
  hasValidAddress,
  isQuotingShipping,
  shippingOptions,
  selectedShippingOption,
  selectedShippingOptionId,
  setSelectedShippingOptionId,
  addressError,
  shippingQuoteError,
  onGoProfile,
  onRequestShippingQuotes,
  effectiveAddress,
  items,
  onSetShipping,
  setStep
}: {
  user: CheckoutScreenProps["user"];
  addresses: Address[];
  needsSavedAddressFromProfile: boolean;
  selectedAddressId: string | undefined;
  setSelectedAddressId: (id: string | undefined) => void;
  guestAddress: Address;
  setGuestAddress: (a: Address) => void;
  hasValidAddress: boolean;
  isQuotingShipping: boolean;
  shippingOptions: ShippingQuoteOptionDto[];
  selectedShippingOption: ShippingQuoteOptionDto | null;
  selectedShippingOptionId: string | null;
  setSelectedShippingOptionId: (id: string | null) => void;
  addressError: string;
  shippingQuoteError: string;
  onGoProfile: () => void;
  onRequestShippingQuotes: (address: Address, itemsCount: number) => Promise<{ ok: true; options: ShippingQuoteOptionDto[] } | { ok: false; error: string }>;
  effectiveAddress: Address;
  items: CheckoutScreenProps["items"];
  onSetShipping: (price: number) => void;
  setStep: (step: 1 | 2 | 3) => void;
}) {
  const handleContinue = async () => {
    if (!hasValidAddress) {
      return;
    }

    if (shippingOptions.length > 0 && selectedShippingOption) {
      onSetShipping(selectedShippingOption.price);
      setStep(2);
      return;
    }

    const quoteResult = await onRequestShippingQuotes(effectiveAddress, items.length);

    if (!quoteResult.ok) {
      return;
    }

    if (quoteResult.options.length === 0) {
      return;
    }

    const defaultOption = quoteResult.options[0];
    setSelectedShippingOptionId(defaultOption.id);
    onSetShipping(defaultOption.price);
  };

  const hasNoAddress = addresses.length === 0;
  const needsGuestForm = !user || (hasNoAddress && !needsSavedAddressFromProfile);

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Selecionar endereco</Text>

      {user && addresses.length > 0 ? (
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
      ) : needsSavedAddressFromProfile ? (
        <>
          <Text style={styles.screenDescription}>Para continuar, cadastre pelo menos um endereco no seu perfil.</Text>
          <Pressable style={styles.primaryActionButton} onPress={onGoProfile}>
            <Text style={styles.primaryActionButtonText}>Cadastrar endereco no perfil</Text>
          </Pressable>
        </>
      ) : (
        <View>
          <Text style={styles.screenDescription}>Preencha seu endereco para continuar sem login.</Text>
          <TextInput style={styles.formInput} value={guestAddress.cep} onChangeText={(value) => setGuestAddress({ ...guestAddress, cep: value })} placeholder="CEP" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.formInput} value={guestAddress.street} onChangeText={(value) => setGuestAddress({ ...guestAddress, street: value })} placeholder="Rua" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.formInput} value={guestAddress.number} onChangeText={(value) => setGuestAddress({ ...guestAddress, number: value })} placeholder="Numero" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.formInput} value={guestAddress.neighborhood} onChangeText={(value) => setGuestAddress({ ...guestAddress, neighborhood: value })} placeholder="Bairro" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.formInput} value={guestAddress.city} onChangeText={(value) => setGuestAddress({ ...guestAddress, city: value })} placeholder="Cidade" placeholderTextColor="#9ca3af" />
          <TextInput style={styles.formInput} value={guestAddress.state} onChangeText={(value) => setGuestAddress({ ...guestAddress, state: value })} placeholder="UF" placeholderTextColor="#9ca3af" autoCapitalize="characters" />
        </View>
      )}

      {user ? (
        <Pressable style={styles.secondaryActionButton} onPress={onGoProfile}>
          <Text style={styles.secondaryActionButtonText}>Gerenciar enderecos</Text>
        </Pressable>
      ) : null}

      <Pressable style={[styles.primaryActionButton, isQuotingShipping ? { opacity: 0.7 } : null]} disabled={isQuotingShipping} onPress={handleContinue}>
        <Text style={styles.primaryActionButtonText}>
          {isQuotingShipping ? "Buscando opcoes..." : shippingOptions.length > 0 ? "Continuar para revisao" : "Buscar opcoes de frete"}
        </Text>
      </Pressable>

      {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
      {shippingQuoteError ? <Text style={styles.errorText}>{shippingQuoteError}</Text> : null}

      {shippingOptions.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.summaryTitle}>Opcoes de frete</Text>
          {shippingOptions.map((option) => (
            <Pressable key={option.id} onPress={() => { setSelectedShippingOptionId(option.id); onSetShipping(option.price); }} style={{ marginTop: 8 }}>
              <View style={[styles.summaryCard, { borderWidth: option.id === selectedShippingOptionId ? 2 : 1, borderColor: option.id === selectedShippingOptionId ? "#2563eb" : "#e5e7eb" }]}>
                <Text style={{ fontWeight: "600", fontSize: 14 }}>{option.label}</Text>
                <Text style={styles.screenDescription}>{option.deliveryEstimate}</Text>
                <Text style={styles.summaryValue}>{toBrl(option.price)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CheckoutStepReview({
  items,
  effectiveAddress,
  subtotal,
  discount,
  shipping,
  total,
  hasValidAddress,
  selectedShippingOptionId,
  reviewError,
  onBack,
  onConfirm
}: {
  items: CheckoutScreenProps["items"];
  effectiveAddress: Address;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  hasValidAddress: boolean;
  selectedShippingOptionId: string | null;
  reviewError: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Revisar pedido</Text>
      <Text style={styles.screenDescription}>{items.length} item(ns) no pedido</Text>

      <View style={{ marginTop: 12 }}>
        {items.map((item, index) => (
          <View key={`${item.product.id}-${item.size}-${index}`} style={styles.summaryLine}>
            <Text style={styles.summaryKey}>{item.quantity}x {item.product.name} ({item.size})</Text>
            <Text style={styles.summaryValue}>{toBrl(item.product.price * item.quantity)}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginVertical: 12, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12 }}>
        <Text style={{ fontWeight: "600", fontSize: 14, marginBottom: 8 }}>Endereco de entrega</Text>
        {effectiveAddress && (
          <View>
            <Text style={styles.screenDescription}>{effectiveAddress.label ?? "Endereco informado"}</Text>
            <Text style={styles.screenDescription}>{effectiveAddress.street}, {effectiveAddress.number}{effectiveAddress.complement ? ` - ${effectiveAddress.complement}` : ""}</Text>
            <Text style={styles.screenDescription}>{effectiveAddress.neighborhood}, {effectiveAddress.city} - {effectiveAddress.state}</Text>
            <Text style={styles.screenDescription}>{effectiveAddress.cep}</Text>
          </View>
        )}
      </View>

      <View style={styles.summaryLine}><Text style={styles.summaryKey}>Subtotal</Text><Text style={styles.summaryValue}>{toBrl(subtotal)}</Text></View>
      <View style={styles.summaryLine}><Text style={styles.summaryKey}>Desconto</Text><Text style={styles.summaryValue}>-{toBrl(discount)}</Text></View>
      <View style={styles.summaryLine}><Text style={styles.summaryKey}>Frete</Text><Text style={styles.summaryValue}>{toBrl(shipping)}</Text></View>
      <View style={styles.summaryLineTotal}><Text style={styles.summaryTotalKey}>Total</Text><Text style={styles.summaryTotalValue}>{toBrl(total)}</Text></View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable style={[styles.secondaryActionButton, { flex: 1 }]} onPress={onBack}>
          <Text style={styles.secondaryActionButtonText}>Voltar</Text>
        </Pressable>
        <Pressable style={[styles.primaryActionButton, { flex: 1 }]} onPress={onConfirm}>
          <Text style={styles.primaryActionButtonText}>Confirmar e pagar</Text>
        </Pressable>
      </View>

      {reviewError ? <Text style={styles.errorText}>{reviewError}</Text> : null}
    </View>
  );
}

function CheckoutStepPayment({
  total,
  user,
  processing,
  finalizationError,
  onBack,
  onConfirmPayment
}: {
  total: number;
  user: CheckoutScreenProps["user"];
  processing: boolean;
  finalizationError: string;
  onBack: () => void;
  onConfirmPayment: () => void;
}) {
  return (
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

      <Pressable style={[styles.primaryActionButton, processing ? { opacity: 0.7 } : null]} disabled={processing} onPress={onConfirmPayment}>
        <Text style={styles.primaryActionButtonText}>{processing ? "Processando..." : user ? `Confirmar pagamento de ${toBrl(total)}` : "Entrar para finalizar"}</Text>
      </Pressable>

      <Pressable style={styles.secondaryActionButton} onPress={onBack}>
        <Text style={styles.secondaryActionButtonText}>Voltar para revisao</Text>
      </Pressable>

      {finalizationError ? <Text style={styles.errorText}>{finalizationError}</Text> : null}
    </View>
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
  onRequestShippingQuotes,
  onBackCart,
  onGoProfile,
  onRequireAuth,
  onFinalizeOrder,
  onOrderComplete
}: CheckoutScreenProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [shippingQuoteError, setShippingQuoteError] = useState("");
  const [isQuotingShipping, setIsQuotingShipping] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingQuoteOptionDto[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);
  const [finalizationError, setFinalizationError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>(
    initialSelectedAddressId ?? (isAddressValid(guestAddressDraft) ? undefined : user?.defaultAddressId)
  );
  const [guestAddress, setGuestAddress] = useState<Address>(guestAddressDraft ?? EMPTY_GUEST_ADDRESS);

  useEffect(() => { setStep(initialStep); }, [initialStep]);

  useEffect(() => {
    if (initialSelectedAddressId) { setSelectedAddressId(initialSelectedAddressId); return; }
    if (isAddressValid(guestAddressDraft)) { setSelectedAddressId(undefined); return; }
    if (!selectedAddressId && user?.defaultAddressId && !isAddressValid(guestAddressDraft)) {
      setSelectedAddressId(user.defaultAddressId);
    }
  }, [guestAddressDraft, initialSelectedAddressId, selectedAddressId, user?.defaultAddressId]);

  useEffect(() => { if (guestAddressDraft) { setGuestAddress(guestAddressDraft); } }, [guestAddressDraft]);

  useEffect(() => {
    setShippingOptions([]);
    setSelectedShippingOptionId(null);
    setShippingQuoteError("");
  }, [selectedAddressId, guestAddress]);

  useEffect(() => {
    onCheckoutContextChange?.({ step, selectedAddressId, guestAddressDraft: isAddressValid(guestAddress) ? guestAddress : null });
  }, [guestAddress, onCheckoutContextChange, selectedAddressId, step]);

  useEffect(() => { if (step !== 2 && reviewError) { setReviewError(""); } }, [reviewError, step]);

  const addresses = user?.addresses ?? [];
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
  const effectiveAddress = selectedAddress ?? guestAddress;
  const hasValidAddress = isAddressValid(effectiveAddress);
  const needsSavedAddressFromProfile = Boolean(user && addresses.length === 0 && !isAddressValid(guestAddressDraft));
  const selectedShippingOption = shippingOptions.find((option) => option.id === selectedShippingOptionId) ?? null;

  if (completed) {
    return (
      <View style={styles.stackScreen}>
        <Text style={styles.screenTitle}>Pedido Realizado!</Text>
        <Text style={styles.screenDescription}>Seu pedido foi confirmado e esta sendo processado.</Text>
        <Pressable style={styles.primaryActionButton} onPress={() => { setCompleted(false); onOrderComplete(effectiveAddress); }}>
          <Text style={styles.primaryActionButtonText}>Voltar para a loja</Text>
        </Pressable>
      </View>
    );
  }

  const handleConfirmReview = () => {
    if (items.length === 0) { setReviewError("Seu carrinho esta vazio. Volte e adicione itens para continuar."); return; }
    if (!hasValidAddress) { setReviewError("Endereco de entrega invalido. Revise os dados para continuar."); return; }
    if (!selectedShippingOptionId) { setReviewError("Selecione uma opcao de frete para continuar."); return; }
    setReviewError("");
    setStep(3);
  };

  const handleConfirmPayment = async () => {
    if (processing) { return; }
    setFinalizationError("");
    if (!user) { onRequireAuth(); return; }

    setProcessing(true);
    try {
      const result = await onFinalizeOrder(effectiveAddress);
      if (!result.ok) {
        setProcessing(false);
        if (result.requiresAuth) { onRequireAuth(); return; }
        setFinalizationError(result.error ?? "Nao foi possivel finalizar. Tente novamente.");
        return;
      }
    } catch {
      setProcessing(false);
      setFinalizationError("Nao foi possivel validar a sessao. Tente novamente.");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    setProcessing(false);
    setCompleted(true);
    onOrderComplete(effectiveAddress);
  };

  const handleAddressContinue = async () => {
    if (!hasValidAddress) { setAddressError("Selecione um endereco valido"); return; }
    setAddressError("");

    if (shippingOptions.length > 0 && selectedShippingOption) {
      onSetShipping(selectedShippingOption.price);
      setStep(2);
      return;
    }

    setIsQuotingShipping(true);
    setShippingQuoteError("");
    const quoteResult = await onRequestShippingQuotes(effectiveAddress, items.length);
    setIsQuotingShipping(false);

    if (!quoteResult.ok) { setShippingQuoteError(quoteResult.error); return; }
    if (quoteResult.options.length === 0) { setShippingQuoteError("Nenhuma opcao de frete disponivel para o destino informado."); return; }

    setShippingOptions(quoteResult.options);
    const defaultOption = quoteResult.options[0];
    setSelectedShippingOptionId(defaultOption.id);
    onSetShipping(defaultOption.price);
  };

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
        <CheckoutStepAddress
          user={user} addresses={addresses} needsSavedAddressFromProfile={needsSavedAddressFromProfile}
          selectedAddressId={selectedAddressId} setSelectedAddressId={setSelectedAddressId}
          guestAddress={guestAddress} setGuestAddress={setGuestAddress}
          hasValidAddress={hasValidAddress} isQuotingShipping={isQuotingShipping}
          shippingOptions={shippingOptions} selectedShippingOption={selectedShippingOption}
          selectedShippingOptionId={selectedShippingOptionId} setSelectedShippingOptionId={setSelectedShippingOptionId}
          addressError={addressError} shippingQuoteError={shippingQuoteError}
          onGoProfile={onGoProfile} onRequestShippingQuotes={onRequestShippingQuotes}
          effectiveAddress={effectiveAddress} items={items} onSetShipping={onSetShipping} setStep={setStep}
        />
      ) : step === 2 ? (
        <CheckoutStepReview
          items={items} effectiveAddress={effectiveAddress} subtotal={subtotal} discount={discount}
          shipping={shipping} total={total} hasValidAddress={hasValidAddress}
          selectedShippingOptionId={selectedShippingOptionId} reviewError={reviewError}
          onBack={() => setStep(1)} onConfirm={handleConfirmReview}
        />
      ) : (
        <CheckoutStepPayment
          total={total} user={user} processing={processing}
          finalizationError={finalizationError} onBack={() => setStep(2)}
          onConfirmPayment={handleConfirmPayment}
        />
      )}
    </View>
  );
}
