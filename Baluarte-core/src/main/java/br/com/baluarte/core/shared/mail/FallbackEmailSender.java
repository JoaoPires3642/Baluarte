package br.com.baluarte.core.shared.mail;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.order.amqp.OrderCompletedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnBean(SmtpEmailSender.class)
public class FallbackEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(FallbackEmailSender.class);

    private final SmtpEmailSender primary;
    private final ResendEmailSender fallback;

    public FallbackEmailSender(SmtpEmailSender primary, @Autowired(required = false) ResendEmailSender fallback) {
        this.primary = primary;
        this.fallback = fallback;
    }

    @Override
    public void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order) {
        try {
            primary.sendOrderConfirmation(event, order);
        } catch (Exception e) {
            log.warn("email.fallback switching_to_resend orderId={} reason={}",
                order.getOrderId(), e.getMessage());

            if (fallback == null) {
                log.error("email.fallback no_fallback_available orderId={}", order.getOrderId());
                return;
            }

            try {
                fallback.sendOrderConfirmation(event, order);
            } catch (Exception f) {
                log.error("email.fallback both_failed orderId={} smtp_reason={} resend_reason={}",
                    order.getOrderId(), e.getMessage(), f.getMessage());
            }
        }
    }

    @Override
    public void sendPasswordReset(String toEmail, String resetLink) {
        try {
            primary.sendPasswordReset(toEmail, resetLink);
        } catch (Exception e) {
            log.warn("email.fallback.password_reset switching_to_resend to={} reason={}",
                toEmail, e.getMessage());

            if (fallback == null) {
                log.error("email.fallback.password_reset no_fallback_available to={}", toEmail);
                return;
            }

            try {
                fallback.sendPasswordReset(toEmail, resetLink);
            } catch (Exception f) {
                log.error("email.fallback.password_reset both_failed to={} smtp_reason={} resend_reason={}",
                    toEmail, e.getMessage(), f.getMessage());
            }
        }
    }
}
