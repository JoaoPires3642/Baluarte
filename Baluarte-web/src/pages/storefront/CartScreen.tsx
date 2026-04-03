import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

import styles from "../../App.styles";
import { toBrl } from "../../lib/format";
import type { CartScreenProps } from "./types";

export function CartScreen({
  items,
  subtotal,
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

      {items.map((item) => (
        <View key={`${item.product.id}-${item.size}`} style={styles.cartItemCard}>
          <Image source={{ uri: item.product.image }} style={styles.cartItemImage} />
          <View style={styles.cartItemContent}>
            <Text style={styles.productTeam}>{item.product.team.name}</Text>
            <Text style={styles.cartItemName}>{item.product.name}</Text>
            <Text style={styles.cartItemMeta}>Tam: {item.size}</Text>
            <View style={styles.qtyRow}>
              <Pressable style={styles.qtyButton} onPress={() => onUpdateQuantity(item.product.id, item.size, item.quantity - 1)}>
                <Text style={styles.qtyButtonText}>-</Text>
              </Pressable>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <Pressable style={styles.qtyButton} onPress={() => onUpdateQuantity(item.product.id, item.size, item.quantity + 1)}>
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
              <Text style={styles.cartLinePrice}>{toBrl(item.product.price * item.quantity)}</Text>
            </View>
          </View>
        </View>
      ))}

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
