import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Baluarte - Artigos Esportivos",
  description:
    "A melhor loja de camisas de times do Brasil. Times nacionais, internacionais e selecoes.",
  keywords: [
    "camisas",
    "times",
    "futebol",
    "brasil",
    "flamengo",
    "palmeiras",
    "corinthians",
    "baluarte",
  ],
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            {children}
            <Analytics />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
