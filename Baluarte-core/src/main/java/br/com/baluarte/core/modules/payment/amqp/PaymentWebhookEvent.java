package br.com.baluarte.core.modules.payment.amqp;

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
    String messageId,
    String eventType,
    String mercadoPagoOrderId,
    String requestId
) {
}
