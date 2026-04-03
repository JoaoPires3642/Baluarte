import type { Address, CartItem, Coupon, Order, Product, Size, Team, User } from "../../lib/types";

export type CouponApplyResult = { ok: true } | { ok: false; error: string };

export type TeamScreenProps = {
  team: Team | null;
  products: Product[];
  onBack: () => void;
  onSelectProduct: (id: string) => void;
};

export type ProductScreenProps = {
  product: Product | null;
  onBackToTeam: (teamId: string) => void;
  onBackHome: () => void;
  onAddToCart: (product: Product, size: Size) => void;
  onGoCart: () => void;
};

export type CartScreenProps = {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (code: string) => CouponApplyResult;
  onRemoveCoupon: () => void;
  onSetShipping: (value: number) => void;
  onUpdateQuantity: (productId: string, size: Size, quantity: number) => void;
  onClearCart: () => void;
  onBackHome: () => void;
  onCheckout: () => void;
};

export type CheckoutScreenProps = {
  user: User | null;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  onSetShipping: (value: number) => void;
  onBackCart: () => void;
  onGoProfile: () => void;
  onRequireAuth: () => void;
  onOrderComplete: () => void;
};

export type LoginScreenProps = {
  initialMode?: "login" | "register";
  onBack: () => void;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (name: string, email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export type OrdersScreenProps = {
  user: User | null;
  orders: Order[];
  onBack: () => void;
  onLogin: () => void;
};

export type ProfileScreenProps = {
  user: User | null;
  ordersCount: number;
  onBack: () => void;
  onLogin: () => void;
  onOpenOrders: () => void;
  onUpdateAddress: (address: Address) => { ok: true } | { ok: false; error: string };
};

export type HomeScreenProps = {
  featuredProducts: Product[];
  onOpenCategory: (slug: string) => void;
  onOpenProduct: (productId: string) => void;
};
