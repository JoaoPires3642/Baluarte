package br.com.baluarte.core.shared.mail;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnBean(EmailSender.class)
public class TransactionalEmailService {

    private static final Logger log = LoggerFactory.getLogger(TransactionalEmailService.class);
    private static final String TEMPLATE_DIR = "templates/email/";

    private final EmailSender emailSender;
    private final AdminProductRepository productRepository;
    private final Map<String, String> templateCache = new ConcurrentHashMap<>();

    public TransactionalEmailService(
        EmailSender emailSender,
        @Autowired(required = false) AdminProductRepository productRepository
    ) {
        this.emailSender = emailSender;
        this.productRepository = productRepository;
    }

    public void sendWelcome(String to, String firstName) {
        String html = render("welcome", Map.of("firstName", firstName != null ? ", " + firstName : ""));
        emailSender.sendHtml(to, "Bem-vindo à Baluarte", html);
        log.info("email.welcome event=sent to={}", to);
    }

    public void sendPasswordReset(String to, String resetLink) {
        String html = render("password-reset", Map.of("resetUrl", resetLink));
        emailSender.sendHtml(to, "Redefina sua senha - Baluarte", html);
        log.info("email.password_reset event=sent to={}", to);
    }

    public void sendOrderConfirmation(CheckoutOrder order) {
        String orderNumber = formatOrderNumber(order);
        String html = renderRaw("order-confirmation", Map.of(
            "orderNumber", orderNumber,
            "itemsHtml", buildItemsHtml(order),
            "shipping", formatDecimal(order.getShippingPrice()),
            "total", formatDecimal(order.getTotalAmount())
        ));
        emailSender.sendHtml(order.getPayerEmail(), "Pedido BAL" + orderNumber + " confirmado!", html);
        log.info("email.order_confirmation event=sent orderId={} to={}", order.getOrderId(), order.getPayerEmail());
    }

    public void sendPaymentPending(CheckoutOrder order, String pixCode) {
        String orderNumber = formatOrderNumber(order);
        String html = render("payment-pending", Map.of(
            "orderNumber", orderNumber,
            "pixCode", pixCode != null ? pixCode : ""
        ));
        emailSender.sendHtml(order.getPayerEmail(), "Pagamento pendente - Pedido BAL" + orderNumber, html);
        log.info("email.payment_pending event=sent orderId={} to={}", order.getOrderId(), order.getPayerEmail());
    }

    public void sendPaymentRejected(CheckoutOrder order, String reason) {
        String orderNumber = formatOrderNumber(order);
        String html = render("payment-rejected", Map.of(
            "orderNumber", orderNumber,
            "reason", reason != null ? reason : "Pagamento recusado pela operadora"
        ));
        emailSender.sendHtml(order.getPayerEmail(), "Pagamento recusado - Pedido BAL" + orderNumber, html);
        log.info("email.payment_rejected event=sent orderId={} to={}", order.getOrderId(), order.getPayerEmail());
    }

    public void sendOrderCancelled(CheckoutOrder order, String reason) {
        String orderNumber = formatOrderNumber(order);
        String reasonText = reason != null && !reason.isBlank() ? ": " + reason : "";
        String html = render("order-cancelled", Map.of(
            "orderNumber", orderNumber,
            "reason", reasonText
        ));
        emailSender.sendHtml(order.getPayerEmail(), "Pedido BAL" + orderNumber + " cancelado", html);
        log.info("email.order_cancelled event=sent orderId={} to={}", order.getOrderId(), order.getPayerEmail());
    }

    public void sendOrderProcessing(CheckoutOrder order) {
        String orderNumber = formatOrderNumber(order);
        String html = render("order-processing", Map.of("orderNumber", orderNumber));
        emailSender.sendHtml(order.getPayerEmail(), "Pedido BAL" + orderNumber + " em preparação", html);
        log.info("email.order_processing event=sent orderId={} to={}", order.getOrderId(), order.getPayerEmail());
    }

    public void sendOrderShipped(CheckoutOrder order) {
        String orderNumber = formatOrderNumber(order);
        String trackingCode = order.getTrackingCode() != null ? order.getTrackingCode() : "";
        String trackingUrl = order.getTrackingUrl() != null ? order.getTrackingUrl() : "";
        String html = render("order-shipped", Map.of(
            "orderNumber", orderNumber,
            "trackingCode", trackingCode,
            "trackingUrl", trackingUrl
        ));
        emailSender.sendHtml(order.getPayerEmail(), "Pedido BAL" + orderNumber + " enviado!", html);
        log.info("email.order_shipped event=sent orderId={} to={}", order.getOrderId(), order.getPayerEmail());
    }

    public void sendOrderDelivered(CheckoutOrder order) {
        String orderNumber = formatOrderNumber(order);
        String html = render("order-delivered", Map.of("orderNumber", orderNumber));
        emailSender.sendHtml(order.getPayerEmail(), "Pedido BAL" + orderNumber + " entregue!", html);
        log.info("email.order_delivered event=sent orderId={} to={}", order.getOrderId(), order.getPayerEmail());
    }

    private String render(String templateName, Map<String, String> variables) {
        String template = loadTemplate(templateName);
        if (template == null) return null;
        return applyVariables(template, variables);
    }

    private String renderRaw(String templateName, Map<String, String> variables) {
        return render(templateName, variables);
    }

    private String loadTemplate(String name) {
        return templateCache.computeIfAbsent(name, k -> {
            try {
                ClassPathResource resource = new ClassPathResource(TEMPLATE_DIR + k + ".html");
                String html = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                log.info("email.template loaded name={} size={}", k, html.length());
                return html;
            } catch (IOException e) {
                log.error("email.template load=failed name={} reason={}", k, e.getMessage());
                return null;
            }
        });
    }

    private static String applyVariables(String template, Map<String, String> variables) {
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }

    private String buildItemsHtml(CheckoutOrder order) {
        if (order.getItems() == null) return "";
        return order.getItems().stream()
            .map(item -> String.format(
                "<tr>" +
                "%s" +
                "<td style=\"padding:12px 6px;color:#10233f;font-weight:500;\">%s</td>" +
                "<td style=\"padding:12px 6px;color:#94a3b8;text-align:center;white-space:nowrap;\">%s</td>" +
                "<td style=\"padding:12px 6px;color:#475569;text-align:center;white-space:nowrap;\">%d</td>" +
                "<td style=\"padding:12px 6px;color:#475569;text-align:right;white-space:nowrap;\">R$ %s</td>" +
                "</tr>",
                resolveProductImage(item.getProductId()),
                item.getProductName(), item.getSize(), item.getQuantity(),
                item.getUnitPrice() != null ? item.getUnitPrice().toPlainString() : "-"
            ))
            .collect(Collectors.joining());
    }

    private String resolveProductImage(String productId) {
        if (productId == null || productId.isBlank() || productRepository == null) return "";
        try {
            String url = productRepository.findById(UUID.fromString(productId))
                .map(AdminProduct::imageUrl)
                .orElse("");
            if (url == null || url.isBlank()) return "";
            return "<td style=\"padding:14px 8px;width:56px;\">" +
                   "<img src=\"" + url + "\" width=\"48\" height=\"48\" " +
                   "style=\"border-radius:8px;display:block;object-fit:cover;\" />" +
                   "</td>";
        } catch (Exception e) {
            log.warn("email.product_image not_found productId={} reason={}", productId, e.getMessage());
            return "";
        }
    }

    private static String formatOrderNumber(CheckoutOrder order) {
        return order.getOrderNumber() != null
            ? order.getOrderNumber().toString()
            : String.valueOf(order.getOrderId());
    }

    private static String formatDecimal(BigDecimal value) {
        return (value != null ? value : BigDecimal.ZERO).toPlainString();
    }
}
