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
	customizationEnabled?: boolean;
	customizationTemplatePng?: string;
	customizationTemplateMetadata?: string;
	teamId: string;
	team: Team;
	sizes: Size[];
	stockBySize?: Record<Size, number>;
	inStock: boolean;
	featured?: boolean;
}

export interface CartCustomizationSnapshot {
	templatePng: string;
	names: string[];
	number?: string;
}

export interface CartItem {
	product: Product;
	size: Size;
	quantity: number;
	customNames?: string[];
	customNumber?: string;
	customizationSnapshot?: CartCustomizationSnapshot;
}

export interface User {
	id: string;
	name: string;
	email: string;
	role: "admin" | "client";
	addresses?: Address[];
	defaultAddressId?: string;
	defaultAddress?: Address;
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
	id?: string;
	cep: string;
	street: string;
	number: string;
	complement?: string;
	neighborhood: string;
	city: string;
	state: string;
	label?: string;
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
