package br.com.baluarte.core.shared.mail;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.order.amqp.OrderCompletedEvent;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty("app.email.resend.api-key")
public class ResendEmailSender {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailSender.class);

    private static final String RESEND_API = "https://api.resend.com/emails";

    private final HttpClient http = HttpClient.newHttpClient();
    private final AdminProductRepository productRepository;

    @Value("${app.email.resend.api-key}")
    private String apiKey;

    @Value("${app.email.from:Baluarte <contato@dombaluarte.com.br>}")
    private String from;

    private String confirmationTemplate;
    private String passwordResetTemplate;

    public ResendEmailSender(AdminProductRepository productRepository) {
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
            String html = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            log.info("email.resend.template loaded path={} size={}", path, html.length());
            return html;
        } catch (IOException e) {
            log.error("email.resend.template load=failed path={} reason={}", path, e.getMessage());
            return null;
        }
    }

    public void sendOrderConfirmation(OrderCompletedEvent event, CheckoutOrder order) {
        if (confirmationTemplate == null) {
            log.warn("email.resend.order_confirmation event=skipped reason=template_not_loaded orderId={}",
                order.getOrderId());
            return;
        }

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

        String html = confirmationTemplate
            .replace("{{orderNumber}}", orderNumber)
            .replace("{{itemsHtml}}", itemsHtml)
            .replace("{{shipping}}", shipping.toPlainString())
            .replace("{{total}}", total.toPlainString());

        try {
            String body = """
                {"from":"%s","to":["%s"],"subject":"Pedido BAL%s confirmado!","html":"%s"}
                """.formatted(
                    escape(from),
                    escape(order.getPayerEmail()),
                    escape(orderNumber),
                    escape(html));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESEND_API))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("email.resend.order_confirmation event=sent orderId={} to={}",
                    order.getOrderId(), order.getPayerEmail());
            } else {
                log.error("email.resend.order_confirmation event=failed orderId={} status={} body={}",
                    order.getOrderId(), response.statusCode(), response.body());
                throw new RuntimeException("Resend API error: " + response.statusCode());
            }
        } catch (IOException | InterruptedException e) {
            log.error("email.resend.order_confirmation event=failed orderId={} to={} reason={}",
                order.getOrderId(), order.getPayerEmail(), e.getMessage());
            throw new RuntimeException("Falha ao enviar email via Resend", e);
        }
    }

    public void sendPasswordReset(String toEmail, String resetLink) {
        if (passwordResetTemplate == null) {
            log.warn("email.resend.password_reset event=skipped reason=template_not_loaded to={}", toEmail);
            return;
        }

        String html = passwordResetTemplate.replace("{{resetUrl}}", resetLink);

        try {
            String body = """
                {"from":"%s","to":["%s"],"subject":"Redefina sua senha - Baluarte","html":"%s"}
                """.formatted(escape(from), escape(toEmail), escape(html));

            sendToResend(body, toEmail);
            log.info("email.resend.password_reset event=sent to={}", toEmail);
        } catch (IOException | InterruptedException e) {
            log.error("email.resend.password_reset event=failed to={} reason={}", toEmail, e.getMessage());
            throw new RuntimeException("Falha ao enviar email de reset via Resend", e);
        }
    }

    private void sendToResend(String body, String toEmail) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(RESEND_API))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new RuntimeException("Resend API error: " + response.statusCode() + " " + response.body());
        }
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");
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
            log.warn("email.resend.product_image not_found productId={} reason={}", productId, e.getMessage());
            return "";
        }
    }
}
