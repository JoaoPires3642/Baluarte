import { ApiClient } from "./client";
import type { ApiRequestOptions, ApiSuccessEnvelope, PaymentRequestDto, PaymentResponseDto } from "./contracts";

const defaultClient = new ApiClient();

export async function createPaymentRequest(
  payload: PaymentRequestDto,
  client: ApiClient = defaultClient,
  options: Omit<ApiRequestOptions, "method" | "body"> = {}
): Promise<PaymentResponseDto> {
  const response = await client.request<PaymentResponseDto>("/payment/requests", {
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  });

  return response.data;
}