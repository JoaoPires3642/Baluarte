import type { CardTokenInput, CardTokenResult } from "./cardTokenProvider";

export async function createMockCardToken(
  input: CardTokenInput
): Promise<CardTokenResult> {
  const digits = input.number.replace(/\D/g, "");
  const status = digits.endsWith("0000") ? "reject" : "approved";

  return {
    token: status === "reject" ? "mock-reject-token" : "mock-approved-token",
    paymentMethodId: digits.startsWith("5") ? "master" : "visa",
    issuerId: "123",
  };
}