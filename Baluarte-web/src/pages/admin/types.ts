import type { AdminCategory, Category, Coupon, Order, Product, Team, User } from "../../lib/types";

export type ValidSize = "P" | "M" | "G" | "GG";

export type AdminProduct = Product & {
  stockQuantity: number;
  stockBySize: Record<ValidSize, number>;
};

export type AdminScreenProps = {
  user: User | null;
  orders: Order[];
  productsCount: number;
  onBack: () => void;
  onLogin: () => void;
  onOpenDashboard: () => void;
  onOpenCategories: () => void;
  onOpenTeams: () => void;
  onOpenProducts: () => void;
  onOpenOrders: () => void;
  onOpenCoupons: () => void;
};

export type AdminBlockedScreenProps = {
  onBack: () => void;
  message: string;
};

export type AdminCategoriesScreenProps = {
  user: User | null;
  categories: AdminCategory[];
  teams: Team[];
  onBack: () => void;
  onUpdateCategories: (next: AdminCategory[]) => void;
};

export type AdminTeamsScreenProps = {
  user: User | null;
  categories: AdminCategory[];
  teams: Team[];
  products: AdminProduct[];
  onBack: () => void;
  onUpdateTeams: (next: Team[]) => void;
};

export type AdminProductsScreenProps = {
  user: User | null;
  categories: AdminCategory[];
  teams: Team[];
  products: AdminProduct[];
  onBack: () => void;
  onUpdateProducts: (next: AdminProduct[]) => void;
};

export type AdminOrdersScreenProps = {
  user: User | null;
  orders: Order[];
  onBack: () => void;
  onUpdateOrders: (next: Order[]) => void;
};

export type AdminCouponsScreenProps = {
  user: User | null;
  coupons: Coupon[];
  onBack: () => void;
  onUpdateCoupons: (next: Coupon[]) => void;
};

export type SlugifyEntity = (value: string) => string;

export type CategoryValue = Category;
