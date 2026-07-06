package br.com.baluarte.core.modules.checkout.amqp;

import tools.jackson.annotation.JsonProperty;

/**
 * Evento publicado quando um webhook do SuperFrete e recebido e validado.
 * O consumer aplicara as transicoes de status/tracking no banco.
 *
 * @param messageId       UUID unico da mensagem (idempotencia)
 * @param eventType       "shipping.label.generated"
 * @param requestId       x-request-id do header do webhook (rastreamento)
 * @param rawBody         corpo bruto do webhook (JSON string)
 */
public record ShippingWebhookEvent(
    @JsonProperty("messageId") String messageId,
    @JsonProperty("eventType") String eventType,
    @JsonProperty("requestId") String requestId,
    @JsonProperty("rawBody") String rawBody
) {
}
