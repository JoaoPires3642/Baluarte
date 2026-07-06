package br.com.baluarte.core.modules.order.amqp;

/**
 * Evento publicado quando um pedido transiciona para o status "paid"
 * (pagamento confirmado). Dispara o fluxo pos-checkout:
 * email de confirmacao, baixa de estoque e solicitacao de etiqueta.
 */
public record OrderCompletedEvent(
    String messageId,
    String eventType,
    String orderId,
    String checkoutSessionId,
    String customerEmail,
    String occurredAt
) {
}
