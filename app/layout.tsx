import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AdminLayoutGuard } from "@/components/admin-layout-guard";
import { Providers } from "@/components/providers";

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Baluarte - Camisas de Futebol Premium",
    template: "%s | Baluarte",
  },
  description: "Camisas oficiais dos maiores times do mundo. Qualidade premium, entrega rápida. times nacionais, estrangeiros e Seleções.",
  keywords: ["camisas de futebol", "uniformes", "times", "Brasileirão", "Premier League", "Seleção Brasileira"],
  openGraph: {
    title: "Baluarte - Futebol Premium",
    description: "Camisas oficiais dos maiores times do mundo.",
    url: "https://baluarte.com.br",
    siteName: "Baluarte",
    locale: "pt_BR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "google-fonts": "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Rubik:wght@300;400;500;600;700&display=swap",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <AdminLayoutGuard><Header /></AdminLayoutGuard>
          <main className="flex-1">{children}</main>
          <AdminLayoutGuard><Footer /></AdminLayoutGuard>
        </Providers>
      </body>
    </html>
  );
}
