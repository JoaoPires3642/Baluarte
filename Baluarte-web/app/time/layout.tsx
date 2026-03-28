import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home | Baluarte",
  description: "Destaques e colecoes de camisas oficiais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children;
}
