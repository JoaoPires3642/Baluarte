export type Category = string;

export interface AdminCategory {
  slug: Category;
  name: string;
  logo: string;
}

export type Size = "P" | "M" | "G" | "GG";

export interface Team {
  id: string;
  name: string;
  logo: string;
  category: Category;
  league?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  teamId: string;
  team: Team;
  sizes: Size[];
  inStock: boolean;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  size: Size;
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client";
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "aguardando_pagamento" | "pronto_envio" | "enviado" | "entregue";
  createdAt: Date;
  shippingAddress: Address;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  minValue?: number;
  active: boolean;
  expiresAt?: Date;
}
