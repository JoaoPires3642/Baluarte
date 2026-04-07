import { useState } from "react";
import { Image, Modal, Pressable, Text, TextInput, View } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import { useViaCep } from "../../hooks/useViaCep";
import type { CartScreenProps } from "./types";

export function CartScreen({
  items,
  subtotal,
  customizationNameCount,
  customizationSubtotal,
  customizationNumberDigitCount,
  customizationNumberSubtotal,
  shipping,
  discount,
  total,
  appliedCoupon,
  onRequestShippingQuotes,
  onApplyCoupon,
  onRemoveCoupon,
  onSetShipping,
  onUpdateQuantity,
  onClearCart,
  onBackHome,
  onCheckout
}: CartScreenProps) {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingCep, setShippingCep] = useState("");
  const [shippingError, setShippingError] = useState("");
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<{
    id: string;
    label: string;
    price: number;
    deliveryEstimate: string;
  }[]>([]);
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState<string | null>(null);
  const { fetchAddressByCep, loading: cepLoading, error: cepError } = useViaCep();

  const calculateShipping = async () => {
    const digits = shippingCep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setShippingError("Informe um CEP valido com 8 digitos");
      return;
    }

    setShippingError("");
    setIsCalculatingShipping(true);

    const viaCepAddress = await fetchAddressByCep(digits);
    if (!viaCepAddress) {
      setIsCalculatingShipping(false);
      setShippingError("Nao foi possivel localizar o CEP informado");
      return;
    }

    const quoteResult = await onRequestShippingQuotes(
      {
        cep: viaCepAddress.cep ?? shippingCep,
        street: viaCepAddress.street ?? "",
        number: "S/N",
        neighborhood: viaCepAddress.neighborhood ?? "",
        city: viaCepAddress.city ?? "",
        state: viaCepAddress.state ?? "",
        complement: viaCepAddress.complement,
        label: "Destino do carrinho"
      },
      items.length
    );

    setIsCalculatingShipping(false);

    if (!quoteResult.ok) {
      setShippingError(quoteResult.error);
      return;
    }

    if (quoteResult.options.length === 0) {
      setShippingError("Nenhuma opcao de frete disponivel para este CEP");
      return;
    }

    const mappedOptions = quoteResult.options.map((option) => ({
      id: option.id,
      label: option.label,
      price: option.price,
      deliveryEstimate: option.deliveryEstimate
    }));

    setShippingOptions(mappedOptions);
    const defaultOption = mappedOptions[0];
    setSelectedShippingOptionId(defaultOption.id);
    onSetShipping(defaultOption.price);
    setShowShippingModal(false);
  };

  if (items.length === 0) {
    return (
      <View style={styles.stackScreen}>
        <Text style={styles.screenTitle}>Seu carrinho esta vazio</Text>
        <Text style={styles.screenDescription}>Adicione produtos para continuar comprando.</Text>
        <Pressable style={styles.primaryActionButton} onPress={onBackHome}>
          <Text style={styles.primaryActionButtonText}>Continuar comprando</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stackScreen}>
      <Pressable onPress={onBackHome}>
        <Text style={styles.backLink}>Voltar</Text>
      </Pressable>
      <Text style={styles.screenTitle}>Carrinho de Compras</Text>

      {items.map((item) => {
        const variantKey = `${item.product.id}-${item.size}-${(item.customNames ?? []).join("|")}-${item.customNumber ?? ""}`;
        const baseLineTotal = item.product.price * item.quantity;
        const namesLineTotal = (item.customNames?.length ?? 0) * 25 * item.quantity;
        const numberLineTotal = (item.customNumber?.length ?? 0) * 20 * item.quantity;
        const lineTotal = baseLineTotal + namesLineTotal + numberLineTotal;

        return (
          <View key={variantKey} style={styles.cartItemCard}>
            <Image source={{ uri: item.product.image }} style={styles.cartItemImage} />
            <View style={styles.cartItemContent}>
              <Text style={styles.productTeam}>{item.product.team.name}</Text>
              <Text style={styles.cartItemName}>{item.product.name}</Text>
              <Text style={styles.cartItemMeta}>Tam: {item.size}</Text>
              {item.customNames && item.customNames.length > 0 ? (
                <>
                  <Text style={styles.cartItemMeta}>Nomes: {item.customNames.join(", ")}</Text>
                  <Text style={styles.cartItemMeta}>
                    Personalizacao: {item.customNames.length} nome(s) x {item.quantity} item(ns)
                  </Text>
                </>
              ) : null}
              {item.customNumber ? <Text style={styles.cartItemMeta}>Numero: {item.customNumber}</Text> : null}
              <Text style={styles.cartItemBreakdownLine}>Base ({item.quantity}x): {toBrl(baseLineTotal)}</Text>
              {namesLineTotal > 0 ? (
                <Text style={styles.cartItemBreakdownLine}>Ajuste nomes: {toBrl(namesLineTotal)}</Text>
              ) : null}
              {numberLineTotal > 0 ? (
                <Text style={styles.cartItemBreakdownLine}>Ajuste numero: {toBrl(numberLineTotal)}</Text>
              ) : null}
              <Text style={styles.cartItemMeta}>Total do item: {toBrl(lineTotal)}</Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyButton}
                  onPress={() => onUpdateQuantity(item.product.id, item.size, item.quantity - 1, item.customNames, item.customNumber)}
                >
                  <Text style={styles.qtyButtonText}>-</Text>
                </Pressable>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyButton}
                  onPress={() => onUpdateQuantity(item.product.id, item.size, item.quantity + 1, item.customNames, item.customNumber)}
                >
                  <Text style={styles.qtyButtonText}>+</Text>
                </Pressable>
                <Text style={styles.cartLinePrice}>{toBrl(lineTotal)}</Text>
              </View>
              <Pressable onPress={() => onUpdateQuantity(item.product.id, item.size, 0, item.customNames, item.customNumber)}>
                <Text style={styles.dangerLink}>Remover item</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <Pressable onPress={onClearCart}>
        <Text style={styles.dangerLink}>Limpar carrinho</Text>
      </Pressable>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Cupom de Desconto</Text>
        {appliedCoupon ? (
          <View style={styles.couponApplied}>
            <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
            <Pressable onPress={onRemoveCoupon}>
              <Text style={styles.dangerLink}>Remover</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.couponForm}>
            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => {
                const result = onApplyCoupon(couponCode);
                if (!result.ok) {
                  setCouponError(result.error);
                  return;
                }
                setCouponCode("");
                setCouponError("");
              }}
            >
              <Text style={styles.secondaryActionButtonText}>Aplicar cupom: {couponCode || "(vazio)"}</Text>
            </Pressable>
            <View style={styles.couponSuggestions}>
              <Pressable onPress={() => setCouponCode("PRIMEIRA10")}>
                <Text style={styles.backLink}>Usar PRIMEIRA10</Text>
              </Pressable>
              <Pressable onPress={() => setCouponCode("FRETE50")}>
                <Text style={styles.backLink}>Usar FRETE50</Text>
              </Pressable>
            </View>
            {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}
          </View>
        )}

        <Text style={styles.summaryTitle}>Frete</Text>
        <Pressable
          style={styles.secondaryActionButton}
          onPress={() => {
            setShippingError("");
            setShowShippingModal(true);
          }}
        >
          <Text style={styles.secondaryActionButtonText}>Calcular frete por CEP</Text>
        </Pressable>

        {cepError ? <Text style={styles.errorText}>{cepError}</Text> : null}
        {shippingError ? <Text style={styles.errorText}>{shippingError}</Text> : null}

        {shippingOptions.length > 0 ? (
          <View style={styles.shippingRow}>
            {shippingOptions.map((option) => {
              const selected = option.id === selectedShippingOptionId;
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.shippingOption,
                    selected ? { borderColor: "#2563eb", borderWidth: 2 } : null
                  ]}
                  onPress={() => {
                    setSelectedShippingOptionId(option.id);
                    onSetShipping(option.price);
                  }}
                >
                  <Text style={styles.shippingLabel}>{option.label}</Text>
                  <Text style={styles.shippingValue}>{toBrl(option.price)}</Text>
                  <Text style={styles.screenDescription}>{option.deliveryEstimate}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={styles.summaryLine}><Text style={styles.summaryKey}>Subtotal</Text><Text style={styles.summaryValue}>{toBrl(subtotal)}</Text></View>
        {customizationNameCount > 0 ? (
          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>Nomes personalizados ({customizationNameCount})</Text>
            <Text style={styles.summaryValue}>{toBrl(customizationSubtotal)}</Text>
          </View>
        ) : null}
        {customizationNumberDigitCount > 0 ? (
          <View style={styles.summaryLine}>
            <Text style={styles.summaryKey}>Numero personalizado ({customizationNumberDigitCount} digitos)</Text>
            <Text style={styles.summaryValue}>{toBrl(customizationNumberSubtotal)}</Text>
          </View>
        ) : null}
        <View style={styles.summaryLine}><Text style={styles.summaryKey}>Desconto</Text><Text style={styles.summaryValue}>-{toBrl(discount)}</Text></View>
        <View style={styles.summaryLine}><Text style={styles.summaryKey}>Frete</Text><Text style={styles.summaryValue}>{shipping > 0 ? toBrl(shipping) : "Calcule pelo CEP"}</Text></View>
        <View style={styles.summaryLineTotal}><Text style={styles.summaryTotalKey}>Total</Text><Text style={styles.summaryTotalValue}>{toBrl(total)}</Text></View>

        <Pressable style={styles.primaryActionButton} onPress={onCheckout}>
          <Text style={styles.primaryActionButtonText}>Finalizar compra</Text>
        </Pressable>
      </View>

      <Modal visible={showShippingModal} transparent animationType="fade" onRequestClose={() => setShowShippingModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.45)",
            justifyContent: "center",
            padding: 20
          }}
        >
          <View style={[styles.summaryCard, { marginTop: 0 }]}> 
            <Text style={styles.summaryTitle}>Calcular frete</Text>
            <Text style={styles.screenDescription}>Informe apenas o CEP para consultar opcoes de entrega.</Text>

            <TextInput
              style={styles.formInput}
              value={shippingCep}
              onChangeText={(value) => {
                const digits = value.replace(/\D/g, "").slice(0, 8);
                const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
                setShippingCep(formatted);
              }}
              placeholder="CEP"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />

            {cepError ? <Text style={styles.errorText}>{cepError}</Text> : null}
            {shippingError ? <Text style={styles.errorText}>{shippingError}</Text> : null}

            <Pressable
              style={[styles.primaryActionButton, isCalculatingShipping || cepLoading ? { opacity: 0.7 } : null]}
              disabled={isCalculatingShipping || cepLoading}
              onPress={() => {
                void calculateShipping();
              }}
            >
              <Text style={styles.primaryActionButtonText}>
                {isCalculatingShipping || cepLoading ? "Calculando..." : "Buscar opcoes"}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryActionButton} onPress={() => setShowShippingModal(false)}>
              <Text style={styles.secondaryActionButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
