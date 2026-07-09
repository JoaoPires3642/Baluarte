package br.com.baluarte.core.shared.mail;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.order.amqp.OrderCompletedEvent;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty("spring.mail.host")
public class SmtpEmailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailSender.class);

    private final JavaMailSender mailSender;
    private final AdminProductRepository productRepository;

    @Value("${app.email.from:Baluarte <contato@dombaluarte.com.br>}")
    private String from;

    private String confirmationTemplate;
    private String passwordResetTemplate;

    public SmtpEmailSender(JavaMailSender mailSender, AdminProductRepository productRepository) {
        this.mailSender = mailSender;
        this.productRepository = productRepository;
    }

    @PostConstruct
    void loadTemplates() {
        confirmationTemplate = loadTemplate("templates/email/order-confirmation.html");
        passwordResetTemplate = loadTemplate("templates/email/password-reset.html");
    }

    private String loadTemplate(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            String html = Files.readString(resource.getFile().toPath(), StandardCharsets.UTF_8);
            log.info("email.template loaded path={} size={}", path, html.length());
            return html;
        } catch (IOException e) {
            log.error("email.template load=failed path={} reason={}", path, e.getMessage());
            return null;
        }
    }

    public void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order) {
        if (confirmationTemplate == null) {
            log.warn("email.order_confirmation event=skipped reason=template_not_loaded orderId={}",
                order.getOrderId());
            return;
        }

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
            throw new RuntimeException("Falha ao enviar email de confirmacao", e);
        }
    }

    public void sendPasswordReset(String toEmail, String resetLink) {
        if (passwordResetTemplate == null) {
            log.warn("email.password_reset event=skipped reason=template_not_loaded to={}", toEmail);
            return;
        }

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject("Redefina sua senha - Baluarte");
            helper.setText(passwordResetTemplate.replace("{{resetUrl}}", resetLink), true);

            mailSender.send(msg);

            log.info("email.password_reset event=sent to={}", toEmail);
        } catch (MessagingException e) {
            log.error("email.password_reset event=failed to={} reason={}", toEmail, e.getMessage());
            throw new RuntimeException("Falha ao enviar email de reset", e);
        }
    }

    private String buildConfirmationHtml(CheckoutOrder order) {
        String orderNumber = order.getOrderNumber() != null
            ? order.getOrderNumber().toString() : String.valueOf(order.getOrderId());

        String itemsHtml = order.getItems() != null
            ? order.getItems().stream()
                .map(item -> {
                    String imgCell = resolveProductImage(item.getProductId());
                    return String.format(
                        "<tr>" +
                        "%s" +
                        "<td style=\"padding:12px 6px;color:#10233f;font-weight:500;\">%s</td>" +
                        "<td style=\"padding:12px 6px;color:#94a3b8;text-align:center;white-space:nowrap;\">%s</td>" +
                        "<td style=\"padding:12px 6px;color:#475569;text-align:center;white-space:nowrap;\">%d</td>" +
                        "<td style=\"padding:12px 6px;color:#475569;text-align:right;white-space:nowrap;\">R$ %s</td>" +
                        "</tr>",
                        imgCell,
                        item.getProductName(), item.getSize(), item.getQuantity(),
                        item.getUnitPrice() != null ? item.getUnitPrice().toPlainString() : "-");
                })
                .collect(Collectors.joining())
            : "";

        BigDecimal shipping = order.getShippingPrice() != null
            ? order.getShippingPrice() : BigDecimal.ZERO;
        BigDecimal total = order.getTotalAmount() != null
            ? order.getTotalAmount() : BigDecimal.ZERO;

        return confirmationTemplate
            .replace("{{orderNumber}}", orderNumber)
            .replace("{{itemsHtml}}", itemsHtml)
            .replace("{{shipping}}", shipping.toPlainString())
            .replace("{{total}}", total.toPlainString());
    }

    private String resolveProductImage(String productId) {
        if (productId == null || productId.isBlank()) {
            return "";
        }
        try {
            String url = productRepository.findById(UUID.fromString(productId))
                .map(AdminProduct::imageUrl)
                .orElse("");
            if (url == null || url.isBlank()) {
                return "";
            }
            return "<td style=\"padding:14px 8px;width:56px;\">" +
                   "<img src=\"" + url + "\" width=\"48\" height=\"48\" " +
                   "style=\"border-radius:8px;display:block;object-fit:cover;\" />" +
                   "</td>";
        } catch (Exception e) {
            log.warn("email.product_image not_found productId={} reason={}", productId, e.getMessage());
            return "";
        }
    }
}
