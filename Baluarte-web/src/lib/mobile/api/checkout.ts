import { ApiClient } from "./client";
import type { Address } from "../../types";
import type { ShippingQuoteOptionDto } from "./contracts";

const defaultClient = new ApiClient();

type ShippingQuoteApiResponse = {
  provider: string;
  options: ShippingQuoteOptionDto[];
};

export async function requestShippingQuotes(
  destination: Address,
  itemsCount: number,
  client: ApiClient = defaultClient
): Promise<ShippingQuoteOptionDto[]> {
  const response = await client.request<ShippingQuoteApiResponse>("/checkout/shipping/quotes", {
    method: "POST",
    body: JSON.stringify({
      destination: {
        cep: destination.cep,
        street: destination.street,
        number: destination.number,
        neighborhood: destination.neighborhood,
        city: destination.city,
        state: destination.state
      },
      itemsCount: Math.max(1, itemsCount)
    })
  });

  return response.data.options ?? [];
}
