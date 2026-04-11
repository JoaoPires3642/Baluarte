import { resolveCardTokenMode } from "../env";
import { createMockCardToken } from "./mockCardTokenProvider";
import { createMercadoPagoCardToken } from "./mercadoPagoCardTokenProvider";

export type CardTokenInput = {
  number: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  cpf: string;
  total: number;
};

export type CardTokenResult = {
  token: string;
  paymentMethodId: string;
  issuerId: string;
};

export async function createCardToken(
  input: CardTokenInput
): Promise<CardTokenResult> {
  const mode = resolveCardTokenMode();
  if (mode === "mercadopago") {
    return createMercadoPagoCardToken(input);
  }
  return createMockCardToken(input);
}