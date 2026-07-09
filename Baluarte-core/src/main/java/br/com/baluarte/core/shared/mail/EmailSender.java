package br.com.baluarte.core.shared.mail;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.order.amqp.OrderCompletedEvent;

/**
 * Contrato para envio de emails transacionais do Baluarte.
 * Implementacao unica: FallbackEmailSender (tenta SMTP, fallback Resend).
 */
public interface EmailSender {

    void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order);

    void sendPasswordReset(String toEmail, String resetLink);
}
