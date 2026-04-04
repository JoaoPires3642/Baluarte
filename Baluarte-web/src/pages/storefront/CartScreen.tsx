import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
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

  const applyShipping = (kind: "pac" | "sedex" | "sedex10") => {
    if (kind === "pac") {
      onSetShipping(25);
      return;
    }
    if (kind === "sedex") {
      onSetShipping(40);
      return;
    }
    onSetShipping(55);
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
        <View style={styles.shippingRow}>
          <Pressable style={styles.shippingOption} onPress={() => applyShipping("pac")}>
            <Text style={styles.shippingLabel}>PAC</Text>
            <Text style={styles.shippingValue}>R$ 25,00</Text>
          </Pressable>
          <Pressable style={styles.shippingOption} onPress={() => applyShipping("sedex")}>
            <Text style={styles.shippingLabel}>SEDEX</Text>
            <Text style={styles.shippingValue}>R$ 40,00</Text>
          </Pressable>
          <Pressable style={styles.shippingOption} onPress={() => applyShipping("sedex10")}>
            <Text style={styles.shippingLabel}>SEDEX 10</Text>
            <Text style={styles.shippingValue}>R$ 55,00</Text>
          </Pressable>
        </View>

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
        <View style={styles.summaryLine}><Text style={styles.summaryKey}>Frete</Text><Text style={styles.summaryValue}>{shipping > 0 ? toBrl(shipping) : "Calcule acima"}</Text></View>
        <View style={styles.summaryLineTotal}><Text style={styles.summaryTotalKey}>Total</Text><Text style={styles.summaryTotalValue}>{toBrl(total)}</Text></View>

        <Pressable style={styles.primaryActionButton} onPress={onCheckout}>
          <Text style={styles.primaryActionButtonText}>Finalizar compra</Text>
        </Pressable>
      </View>
    </View>
  );
}
