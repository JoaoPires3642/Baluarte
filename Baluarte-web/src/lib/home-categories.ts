export type HomeCategory = {
  name: string;
  slug: string;
  image: string;
  color: string;
  icon: string;
};

export const homeCategories: HomeCategory[] = [
  {
    name: "Nacionais",
    slug: "nacionais",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=80",
    color: "#1e3c72",
    icon: "🏆"
  },
  {
    name: "Internacionais",
    slug: "internacionais",
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&q=80",
    color: "#c41e3a",
    icon: "🌎"
  },
  {
    name: "Selecoes",
    slug: "selecoes",
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80",
    color: "#ffd700",
    icon: "⭐"
  },
  {
    name: "Personalizado",
    slug: "personalizado",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    color: "#0f766e",
    icon: "✍️"
  }
];
