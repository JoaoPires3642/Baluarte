interface MercadoPago {
  new (publicKey: string, options?: { locale: string }): {
    fields: {
      create(type: "cardNumber" | "expirationDate" | "securityCode", options?: { placeholder?: string }): {
        mount(elementId: string): void
        on?(event: "binChange", callback: (data: { bin?: string } | string) => void): void
        unmount?(): void
      }
      createCardToken(data: Record<string, unknown>): Promise<{
        id: string
        payment_method_id: string
        issuer_id: string
        first_six_digits?: string
        [key: string]: unknown
      }>
    }
    cardForm(opts: Record<string, unknown>): void
    getIdentificationTypes(): Promise<Array<{ id: string; name: string; type: string }>>
    getInstallments(data: { amount: string; bin: string; paymentTypeId: "credit_card" }): Promise<Array<{
      payer_costs?: Array<{
        installments: number
        installment_amount: number
        total_amount: number
        recommended_message?: string
      }>
    }>>
  }
}

interface Window {
  MercadoPago: MercadoPago
}
