import type { Address, CartItem, Coupon, Order, Product, Size, Team, User } from "../../lib/types";
import type { ShippingQuoteOptionDto } from "../../lib/mobile/api/contracts";

export type CouponApplyResult = { ok: true } | { ok: false; error: string };

export type TeamScreenProps = {
  team: Team | null;
  products: Product[];
  searchQuery: string;
  selectedSize: Size | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  onChangeSearchQuery: (value: string) => void;
  onToggleSize: (size: Size) => void;
  onToggleInStockOnly: () => void;
  onToggleOnSaleOnly: () => void;
  onClearFilters: () => void;
  onBack: () => void;
  onSelectProduct: (id: string) => void;
};

export type ProductScreenProps = {
  product: Product | null;
  onBackToTeam: (teamId: string) => void;
  onBackHome: () => void;
  onAddToCart: (product: Product, size: Size, customNames?: string[], customNumber?: string) => void;
  onGoCart: () => void;
};

export type CartScreenProps = {
  items: CartItem[];
  subtotal: number;
  customizationNameCount: number;
  customizationSubtotal: number;
  customizationNumberDigitCount: number;
  customizationNumberSubtotal: number;
  shipping: number;
  discount: number;
  total: number;
  appliedCoupon: Coupon | null;
  onRequestShippingQuotes: (
    destination: Address,
    itemsCount: number
  ) => Promise<{ ok: true; options: ShippingQuoteOptionDto[] } | { ok: false; error: string }>;
  onApplyCoupon: (code: string) => CouponApplyResult;
  onRemoveCoupon: () => void;
  onSetShipping: (value: number) => void;
  onUpdateQuantity: (productId: string, size: Size, quantity: number, customNames?: string[], customNumber?: string) => void;
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
  initialStep?: 1 | 2 | 3;
  initialSelectedAddressId?: string;
  guestAddressDraft?: Address | null;
  onCheckoutContextChange?: (context: { step: 1 | 2 | 3; selectedAddressId?: string; guestAddressDraft: Address | null }) => void;
  onSetShipping: (value: number) => void;
  onRequestShippingQuotes: (
    destination: Address,
    itemsCount: number
  ) => Promise<{ ok: true; options: ShippingQuoteOptionDto[] } | { ok: false; error: string }>;
  onBackCart: () => void;
  onGoProfile: () => void;
  onRequireAuth: () => void;
  onFinalizeOrder: (
    shippingAddress?: Address
  ) => Promise<{ ok: true } | { ok: false; requiresAuth?: boolean; error?: string }>;
  onOrderComplete: (shippingAddress?: Address) => void;
};

export type LoginScreenProps = {
  initialMode?: "login" | "register";
  onBack: () => void;
  onStartEmailLogin: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onVerifyEmailOtp: (code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onStartEmailRegister: (firstName: string, lastName: string, email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onVerifyRegisterOtp: (code: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onLoginWithSocial: (provider: "google" | "apple") => Promise<{ ok: true } | { ok: false; error: string }>;
  onRegister: (firstName: string, lastName: string, email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
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
  onUpdateAddress: (address: Address) => Promise<{ ok: true } | { ok: false; error: string }> | { ok: true } | { ok: false; error: string };
  onUpdateAddresses: (
    addresses: Address[],
    defaultAddressId?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }> | { ok: true } | { ok: false; error: string };
};

export type HomeScreenProps = {
  featuredProducts: Product[];
  onOpenCategory: (slug: string) => void;
  onOpenProduct: (productId: string) => void;
};
