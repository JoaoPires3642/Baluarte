import { useMemo, useState } from "react";

import type { CartItem, Coupon, Product, Size } from "../lib/types";

export function useCartState() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shipping, setShipping] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cartItems]);
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
    return product.inStock && product.sizes.includes(size) ? 999 : 0;
  };

  const addToCart = (product: Product, size: Size) => {
    setCartItems((prev) => {
      const available = getAvailableBySize(product, size);
      if (available <= 0) {
        return prev;
      }

      const idx = prev.findIndex((item) => item.product.id === product.id && item.size === size);
      if (idx >= 0) {
        if (prev[idx].quantity >= available) {
          return prev;
        }
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, size, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, size: Size, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => !(item.product.id === productId && item.size === size)));
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId || item.size !== size) {
          return item;
        }
        const available = getAvailableBySize(item.product, size);
        return { ...item, quantity: Math.min(quantity, Math.max(1, available)) };
      })
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
    subtotal,
    discount,
    total,
    cartCount,
    addToCart,
    updateCartQuantity,
    clearCart
  };
}
