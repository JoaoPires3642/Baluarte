import { Team, Product, Order, Coupon, Size } from "./types";

const PRODUCT_SIZES: Size[] = ["P", "M", "G", "GG", "G1", "G2", "G3", "G4"];

export const teams: Team[] = [
  // Nacionais - Série A
  { id: "flamengo", name: "Flamengo", logo: "https://assets.football-logos.cc/logos/brazil/512x512/flamengo.0ec2cd2d.png", category: "nacionais", league: "Série A" },
  { id: "palmeiras", name: "Palmeiras", logo: "https://assets.football-logos.cc/logos/brazil/512x512/palmeiras.cd04fee3.png", category: "nacionais", league: "Série A" },
  { id: "corinthians", name: "Corinthians", logo: "https://assets.football-logos.cc/logos/brazil/512x512/corinthians.c5a2d838.png", category: "nacionais", league: "Série A" },
  { id: "sao-paulo", name: "São Paulo", logo: "https://assets.football-logos.cc/logos/brazil/512x512/sao-paulo.7e007a6e.png", category: "nacionais", league: "Série A" },
  { id: "santos", name: "Santos", logo: "https://assets.football-logos.cc/logos/brazil/512x512/santos.f310d725.png", category: "nacionais", league: "Série A" },
  { id: "botafogo", name: "Botafogo", logo: "https://assets.football-logos.cc/logos/brazil/512x512/botafogo.8e46676a.png", category: "nacionais", league: "Série A" },
  { id: "fluminense", name: "Fluminense", logo: "https://assets.football-logos.cc/logos/brazil/512x512/fluminense.7b0d1eec.png", category: "nacionais", league: "Série A" },
  { id: "gremio", name: "Grêmio", logo: "https://assets.football-logos.cc/logos/brazil/512x512/gremio.4ad82819.png", category: "nacionais", league: "Série A" },
  { id: "internacional", name: "Internacional", logo: "https://assets.football-logos.cc/logos/brazil/512x512/internacional.85266e54.png", category: "nacionais", league: "Série A" },
  { id: "atletico-mg", name: "Atlético-MG", logo: "https://assets.football-logos.cc/logos/brazil/512x512/atletico-mineiro.da10887f.png", category: "nacionais", league: "Série A" },
  
  // Internacionais
  { id: "real-madrid", name: "Real Madrid", logo: "https://assets.football-logos.cc/logos/spain/512x512/real-madrid.c97a476c.png", category: "internacionais", league: "La Liga" },
  { id: "barcelona", name: "Barcelona", logo: "https://assets.football-logos.cc/logos/spain/512x512/barcelona.0c5456e6.png", category: "internacionais", league: "La Liga" },
  { id: "manchester-city", name: "Manchester City", logo: "https://assets.football-logos.cc/logos/england/512x512/manchester-city.ef1fe757.png", category: "internacionais", league: "Premier League" },
  { id: "liverpool", name: "Liverpool", logo: "https://assets.football-logos.cc/logos/england/512x512/liverpool.bc7f4063.png", category: "internacionais", league: "Premier League" },
  { id: "psg", name: "PSG", logo: "https://assets.football-logos.cc/logos/france/512x512/paris-saint-germain.97a456ea.png", category: "internacionais", league: "Ligue 1" },
  { id: "juventus", name: "Juventus", logo: "https://assets.football-logos.cc/logos/italy/512x512/juventus.4efced70.png", category: "internacionais", league: "Serie A" },
  { id: "bayern", name: "Bayern de Munique", logo: "https://assets.football-logos.cc/logos/germany/512x512/bayern-munchen.8eda8ecc.png", category: "internacionais", league: "Bundesliga" },
  { id: "inter-milan", name: "Inter de Milão", logo: "https://assets.football-logos.cc/logos/italy/512x512/inter.ba4c3469.png", category: "internacionais", league: "Serie A" },
  
  // Seleções
  { id: "brasil", name: "Brasil", logo: "https://assets.football-logos.cc/logos/brazil/512x512/brazil-national-team.004213f2.png", category: "selecoes" },
  { id: "argentina", name: "Argentina", logo: "https://assets.football-logos.cc/logos/argentina/512x512/argentina-national-team.16ef6a1d.png", category: "selecoes" },
  { id: "franca", name: "França", logo: "https://assets.football-logos.cc/logos/france/512x512/france-national-team.ba2667a5.png", category: "selecoes" },
  { id: "alemanha", name: "Alemanha", logo: "https://assets.football-logos.cc/logos/germany/512x512/germany-national-team.d354ad14.png", category: "selecoes" },
  { id: "portugal", name: "Portugal", logo: "https://assets.football-logos.cc/logos/portugal/700x700/portuguese-football-federation.21becde8.png", category: "selecoes" },
  { id: "espanha", name: "Espanha", logo: "https://assets.football-logos.cc/logos/spain/512x512/spain-national-team.cfaf3e51.png", category: "selecoes" },
];

export const products: Product[] = [
  // Flamengo
  {
    id: "fla-home-2024",
    name: "Camisa Flamengo I 2024",
    description: "Camisa oficial do Flamengo para a temporada 2024. Modelo titular com as tradicionais listras rubro-negras.",
    price: 299.90,
    originalPrice: 349.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    customizationEnabled: true,
    customizationTemplatePng: "https://flamengo.vtexassets.com/arquivos/ids/177009-800-450?v=638853314009100000&width=800&height=450&aspect=true",
    teamId: "flamengo",
    team: teams.find(t => t.id === "flamengo")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
    featured: true,
  },
  {
    id: "fla-away-2024",
    name: "Camisa Flamengo II 2024",
    description: "Camisa reserva do Flamengo para a temporada 2024. Design moderno em branco.",
    price: 299.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "flamengo",
    team: teams.find(t => t.id === "flamengo")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
  },
  // Palmeiras
  {
    id: "pal-home-2024",
    name: "Camisa Palmeiras I 2024",
    description: "Camisa oficial do Palmeiras para a temporada 2024. O manto verde do Verdão.",
    price: 289.90,
    originalPrice: 329.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "palmeiras",
    team: teams.find(t => t.id === "palmeiras")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
    featured: true,
  },
  // Corinthians
  {
    id: "cor-home-2024",
    name: "Camisa Corinthians I 2024",
    description: "Camisa oficial do Corinthians para a temporada 2024. O manto do Timão.",
    price: 289.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "corinthians",
    team: teams.find(t => t.id === "corinthians")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
  },
  // São Paulo
  {
    id: "spfc-home-2024",
    name: "Camisa São Paulo I 2024",
    description: "Camisa oficial do São Paulo para a temporada 2024. O tricolor paulista.",
    price: 289.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "sao-paulo",
    team: teams.find(t => t.id === "sao-paulo")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
  },
  // Real Madrid
  {
    id: "rm-home-2024",
    name: "Camisa Real Madrid I 2024",
    description: "Camisa oficial do Real Madrid para a temporada 2024. O branco merengue.",
    price: 449.90,
    originalPrice: 499.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "real-madrid",
    team: teams.find(t => t.id === "real-madrid")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
    featured: true,
  },
  // Barcelona
  {
    id: "fcb-home-2024",
    name: "Camisa Barcelona I 2024",
    description: "Camisa oficial do Barcelona para a temporada 2024. As tradicionais listras blaugrana.",
    price: 449.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "barcelona",
    team: teams.find(t => t.id === "barcelona")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
  },
  // Manchester City
  {
    id: "mci-home-2024",
    name: "Camisa Manchester City I 2024",
    description: "Camisa oficial do Manchester City para a temporada 2024. O azul celeste dos Citizens.",
    price: 449.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "manchester-city",
    team: teams.find(t => t.id === "manchester-city")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
  },
  // Brasil
  {
    id: "bra-home-2024",
    name: "Camisa Brasil I 2024",
    description: "Camisa oficial da Seleção Brasileira para 2024. O amarelo canarinho.",
    price: 399.90,
    originalPrice: 449.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "brasil",
    team: teams.find(t => t.id === "brasil")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
    featured: true,
  },
  // Argentina
  {
    id: "arg-home-2024",
    name: "Camisa Argentina I 2024",
    description: "Camisa oficial da Seleção Argentina para 2024. A albiceleste campeã do mundo.",
    price: 399.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "argentina",
    team: teams.find(t => t.id === "argentina")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
  },
  // França
  {
    id: "fra-home-2024",
    name: "Camisa França I 2024",
    description: "Camisa oficial da Seleção Francesa para 2024. Les Bleus.",
    price: 399.90,
    image: "https://images.unsplash.com/photo-1580089595767-98745d7025c5?w=400&h=500&fit=crop",
    teamId: "franca",
    team: teams.find(t => t.id === "franca")!,
    sizes: PRODUCT_SIZES,
    inStock: true,
  },
];

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    userId: "user-1",
    items: [
      {
        product: products[0],
        size: "M",
        quantity: 1,
      },
    ],
    total: 299.90,
    status: "aguardando_pagamento",
    createdAt: new Date("2024-03-20"),
    shippingAddress: {
      cep: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
  },
  {
    id: "ORD-002",
    userId: "user-2",
    items: [
      {
        product: products[2],
        size: "G",
        quantity: 2,
      },
    ],
    total: 579.80,
    status: "pronto_envio",
    createdAt: new Date("2024-03-19"),
    shippingAddress: {
      cep: "22041-080",
      street: "Av. Atlântica",
      number: "500",
      neighborhood: "Copacabana",
      city: "Rio de Janeiro",
      state: "RJ",
    },
  },
  {
    id: "ORD-003",
    userId: "user-3",
    items: [
      {
        product: products[5],
        size: "GG",
        quantity: 1,
      },
    ],
    total: 449.90,
    status: "enviado",
    createdAt: new Date("2024-03-18"),
    shippingAddress: {
      cep: "30130-000",
      street: "Praça Sete",
      number: "100",
      neighborhood: "Centro",
      city: "Belo Horizonte",
      state: "MG",
    },
  },
];

export const mockCoupons: Coupon[] = [
  {
    id: "cup-1",
    code: "PRIMEIRA10",
    type: "percentage",
    value: 10,
    active: true,
  },
  {
    id: "cup-2",
    code: "FRETE50",
    type: "fixed",
    value: 50,
    minValue: 200,
    active: true,
  },
];

export function getTeamsByCategory(category: string) {
  return teams.filter((team) => team.category === category);
}

export function getProductsByTeam(teamId: string) {
  return products.filter((product) => product.teamId === teamId);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getFeaturedProducts() {
  return products.filter((product) => product.featured);
}

export function getTeamById(id: string) {
  return teams.find((team) => team.id === id);
}
