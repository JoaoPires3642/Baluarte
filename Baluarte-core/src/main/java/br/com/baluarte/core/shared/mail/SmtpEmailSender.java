package br.com.baluarte.core.shared.mail;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.order.amqp.OrderCompletedEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty("spring.mail.host")
public class SmtpEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailSender.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.from:Baluarte <contato@dombaluarte.com.br>}")
    private String from;

    public SmtpEmailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(order.getPayerEmail());
            helper.setSubject("Pedido BAL" + order.getOrderNumber() + " confirmado!");
            helper.setText(buildConfirmationHtml(order), true);

            mailSender.send(msg);

            log.info("email.order_confirmation event=sent orderId={} to={}",
                order.getOrderId(), order.getPayerEmail());
        } catch (MessagingException e) {
            log.error("email.order_confirmation event=failed orderId={} to={} reason={}",
                order.getOrderId(), order.getPayerEmail(), e.getMessage());
        }
    }

    private String buildConfirmationHtml(CheckoutOrder order) {
        String itemsHtml = order.getItems() != null
            ? order.getItems().stream()
                .map(item -> String.format(
                    "<tr><td>%s</td><td>%s</td><td>%d</td><td>R$ %s</td></tr>",
                    item.getProductName(), item.getSize(), item.getQuantity(),
                    item.getUnitPrice() != null ? item.getUnitPrice().toPlainString() : "-"))
                .collect(Collectors.joining())
            : "";

        BigDecimal shipping = order.getShippingPrice() != null
            ? order.getShippingPrice() : BigDecimal.ZERO;
        BigDecimal total = order.getTotalAmount() != null
            ? order.getTotalAmount() : BigDecimal.ZERO;

        return """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"></head>
            <body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px">
            <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;
                        border:1px solid #d9e2ef">
              <h2 style="color:#10233f;margin-top:0">Pedido confirmado!</h2>
              <p style="color:#444;font-size:15px">Seu pedido <strong>BAL%s</strong>
                 foi confirmado e esta sendo preparado.</p>
              <table style="width:100%%;border-collapse:collapse;margin:16px 0;font-size:14px">
                <thead><tr style="background:#f4f7fb;text-align:left">
                  <th style="padding:8px">Produto</th><th>Tamanho</th><th>Qtd</th><th>Preco</th>
                </tr></thead>
                <tbody>%s</tbody>
              </table>
              <p style="text-align:right;font-size:14px;color:#666">
                 Frete: R$ %s<br><strong>Total: R$ %s</strong>
              </p>
              <p style="color:#888;font-size:12px;margin-top:24px">
                 Voce recebera atualizacoes pelo WhatsApp e email quando o pedido for enviado.
              </p>
              <hr style="border:none;border-top:1px solid #d9e2ef;margin:16px 0">
              <p style="color:#999;font-size:11px;text-align:center">
                 Baluarte — Artigos Esportivos<br>
                 contato@dombaluarte.com.br
              </p>
            </div>
            </body>
            </html>
            """.formatted(
                order.getOrderNumber() != null ? order.getOrderNumber() : order.getOrderId(),
                itemsHtml,
                shipping.toPlainString(),
                total.toPlainString()
            );
    }
}
