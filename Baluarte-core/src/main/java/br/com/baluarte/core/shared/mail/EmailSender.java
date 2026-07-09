package br.com.baluarte.core.shared.mail;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.order.amqp.OrderCompletedEvent;

/**
 * Contrato para envio de emails transacionais do Baluarte.
 * Implementacao unica: FallbackEmailSender (tenta SMTP, fallback Resend).
 */
public interface EmailSender {

    /**
     * Envia o email de confirmacao de pedido para o cliente.
     */
    void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order);
}
