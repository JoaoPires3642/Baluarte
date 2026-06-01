interface MercadoPago {
  new (publicKey: string, options?: { locale: string }): {
    fields: {
      create(type: "cardNumber" | "expirationDate" | "securityCode", options?: { placeholder?: string }): {
        mount(elementId: string): void
        unmount?(): void
      }
      createCardToken(data: Record<string, unknown>): Promise<{
        id: string
        payment_method_id: string
        issuer_id: string
        [key: string]: unknown
      }>
    }
    cardForm(opts: Record<string, unknown>): void
    getIdentificationTypes(): Promise<Array<{ id: string; name: string; type: string }>>
  }
}

interface Window {
  MercadoPago: MercadoPago
}
