import { ClerkProvider } from "@clerk/nextjs"

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>
}
