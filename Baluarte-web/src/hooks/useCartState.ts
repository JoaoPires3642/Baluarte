import { useMemo, useState } from "react";

import type { CartCustomizationSnapshot, CartItem, Coupon, Product, Size } from "../lib/types";

const CUSTOM_NAME_PRICE_BRL = 25;
const CUSTOM_NUMBER_DIGIT_PRICE_BRL = 20;

const normalizeCustomNames = (customNames?: string[]): string[] => {
  return (customNames ?? []).map((name) => name.trim()).filter((name) => name.length > 0);
};

const buildCustomizationVariantKey = (customNames?: string[], customNumber?: string): string => {
  const namesKey = normalizeCustomNames(customNames).join("|").toLowerCase();
  const numberKey = (customNumber ?? "").trim();
  return `${namesKey}::${numberKey}`;
};

const buildCustomizationSnapshot = (
  product: Product,
  customNames: string[],
  customNumber?: string
): CartCustomizationSnapshot | undefined => {
  if (!product.customizationTemplatePng) {
    return undefined;
  }

  if (customNames.length === 0 && !customNumber) {
    return undefined;
  }

  return {
    templatePng: product.customizationTemplatePng,
    names: customNames,
    number: customNumber
  };
};

export function useCartState() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shipping, setShipping] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const customizationNameCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.customNames?.length ?? 0) * item.quantity, 0),
    [cartItems]
  );
  const customizationNumberDigitCount = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const digits = item.customNumber ? item.customNumber.length : 0;
        return sum + digits * item.quantity;
      }, 0),
    [cartItems]
  );
  const customizationSubtotal = useMemo(() => customizationNameCount * CUSTOM_NAME_PRICE_BRL, [customizationNameCount]);
  const customizationNumberSubtotal = useMemo(
    () => customizationNumberDigitCount * CUSTOM_NUMBER_DIGIT_PRICE_BRL,
    [customizationNumberDigitCount]
  );
  const baseSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );
  const subtotal = useMemo(
    () => baseSubtotal + customizationSubtotal + customizationNumberSubtotal,
    [baseSubtotal, customizationSubtotal, customizationNumberSubtotal]
  );
  const discount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }
    if (appliedCoupon.type === "percentage") {
      return subtotal * (appliedCoupon.value / 100);
    }
    return appliedCoupon.value;
  }, [appliedCoupon, subtotal]);
  const total = useMemo(() => Math.max(0, subtotal - discount + shipping), [subtotal, discount, shipping]);
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const getAvailableBySize = (product: Product, size: Size): number => {
    if (product.stockBySize && Number.isFinite(product.stockBySize[size])) {
      return Math.max(0, product.stockBySize[size]);
    }
    return 0;
  };

  const addToCart = (product: Product, size: Size, customNames: string[] = [], customNumber?: string) => {
    setCartItems((prev) => {
      const available = getAvailableBySize(product, size);
      if (available <= 0) {
        return prev;
      }

      const normalizedCustomNames = normalizeCustomNames(customNames);
      const normalizedCustomNumber = customNumber?.trim();
      const variantKey = buildCustomizationVariantKey(normalizedCustomNames, normalizedCustomNumber);
      const customizationSnapshot = buildCustomizationSnapshot(product, normalizedCustomNames, normalizedCustomNumber);

      const idx = prev.findIndex((item) => {
        if (item.product.id !== product.id || item.size !== size) {
          return false;
        }
        return buildCustomizationVariantKey(item.customNames, item.customNumber) === variantKey;
      });
      if (idx >= 0) {
        if (prev[idx].quantity >= available) {
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          product,
          size,
          quantity: 1,
          customNames: normalizedCustomNames,
          customNumber: normalizedCustomNumber,
          customizationSnapshot
        }
      ];
    });
  };

  const updateCartQuantity = (productId: string, size: Size, quantity: number, customNames?: string[], customNumber?: string) => {
    const hasVariantFilter = customNames !== undefined || customNumber !== undefined;
    const requestedVariantKey = hasVariantFilter ? buildCustomizationVariantKey(customNames, customNumber) : null;

    if (quantity <= 0) {
      setCartItems((prev) =>
        prev.filter((item) => {
          if (item.product.id !== productId || item.size !== size) {
            return true;
          }
          if (!hasVariantFilter) {
            return false;
          }
          return buildCustomizationVariantKey(item.customNames, item.customNumber) !== requestedVariantKey;
        })
      );
      return;
    }

    setCartItems((prev) =>
      prev.reduce<CartItem[]>((next, item) => {
        if (
          item.product.id !== productId ||
          item.size !== size ||
          (hasVariantFilter && buildCustomizationVariantKey(item.customNames, item.customNumber) !== requestedVariantKey)
        ) {
          next.push(item);
          return next;
        }

        const available = getAvailableBySize(item.product, size);
        if (available <= 0) {
          return next;
        }

        next.push({ ...item, quantity: Math.min(quantity, available) });
        return next;
      }, [])
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setShipping(0);
  };

  return {
    cartItems,
    shipping,
    setShipping,
    appliedCoupon,
    setAppliedCoupon,
    baseSubtotal,
    subtotal,
    customizationNameCount,
    customizationSubtotal,
    customizationNumberDigitCount,
    customizationNumberSubtotal,
    discount,
    total,
    cartCount,
    addToCart,
    updateCartQuantity,
    clearCart
  };
}
