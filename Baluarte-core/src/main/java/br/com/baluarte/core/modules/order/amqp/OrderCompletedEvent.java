package br.com.baluarte.core.modules.order.amqp;

import tools.jackson.annotation.JsonProperty;

/**
 * Evento publicado quando um pedido transiciona para o status "paid"
 * (pagamento confirmado). Dispara o fluxo pos-checkout:
 * email de confirmacao, baixa de estoque e solicitacao de etiqueta.
 */
public record OrderCompletedEvent(
    @JsonProperty("messageId") String messageId,
    @JsonProperty("eventType") String eventType,
    @JsonProperty("orderId") String orderId,
    @JsonProperty("checkoutSessionId") String checkoutSessionId,
    @JsonProperty("customerEmail") String customerEmail,
    @JsonProperty("occurredAt") String occurredAt
) {
}
