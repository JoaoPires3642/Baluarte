import type { CardTokenInput, CardTokenResult } from "./cardTokenProvider";

export async function createMercadoPagoCardToken(
  _input: CardTokenInput
): Promise<CardTokenResult> {
  const runtime = typeof navigator !== "undefined" ? navigator.product : "unknown";
  throw new Error(
    runtime === "ReactNative"
      ? "Mercado Pago card tokenization requires a supported native bridge/dev build. Use mock card token mode in Expo Go."
      : "Mercado Pago card token provider is not configured for this runtime."
  );
}