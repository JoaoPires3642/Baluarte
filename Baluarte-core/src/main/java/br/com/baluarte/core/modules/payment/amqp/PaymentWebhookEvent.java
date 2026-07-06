package br.com.baluarte.core.modules.payment.amqp;

import tools.jackson.annotation.JsonProperty;

/**
 * Evento publicado quando um webhook do Mercado Pago e recebido e validado.
 * O consumer fara a chamada HTTP a API do MP e as atualizacoes de banco.
 *
 * @param messageId            UUID unico da mensagem (idempotencia)
 * @param eventType            "payment.received"
 * @param mercadoPagoOrderId   ID da order no Mercado Pago
 * @param requestId            x-request-id do header do webhook (rastreamento)
 */
public record PaymentWebhookEvent(
    @JsonProperty("messageId") String messageId,
    @JsonProperty("eventType") String eventType,
    @JsonProperty("mercadoPagoOrderId") String mercadoPagoOrderId,
    @JsonProperty("requestId") String requestId
) {
}
