package br.com.baluarte.core.modules.payment.application;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import br.com.baluarte.core.modules.order.amqp.OrderCompletedEvent;
import br.com.baluarte.core.modules.order.amqp.OrderEventPublisher;
import br.com.baluarte.core.shared.amqp.BaluarteAmqp;
import br.com.baluarte.core.shared.mail.PaymentRejectionMessages;
import br.com.baluarte.core.shared.mail.TransactionalEmailService;

/**
 * Processa webhooks do Mercado Pago: busca a order via API do MP e aplica
 * as transicoes de status no banco. Extraido do MercadoPagoWebhookController
 * para ser compartilhado entre o caminho sincrono e o consumer AMQP.
 *
 * Comportamento identico ao codigo original do controller — sem mudancas de logica.
 */
@Service
public class MercadoPagoWebhookService {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoWebhookService.class);
    private static final String FIELD_STATUS = "status";
    private static final String STATUS_CANCELLED = "cancelled";
    private static final String STATUS_REFUNDED = "refunded";

    private final CheckoutOrderRepository orderRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final SpringDataAdminProductVariantJpaRepository variantRepository;
    private final PaymentGateway paymentGateway;
    private final TransactionTemplate transactionTemplate;

    @Autowired(required = false)
    private OrderEventPublisher orderEventPublisher;

    @Autowired(required = false)
    private TransactionalEmailService emailService;

    @Value("${app.payment.mercadopago.access-token:}")
    private String accessToken;

    private final RestClient mercadoPagoRestClient;

    public MercadoPagoWebhookService(
        CheckoutOrderRepository orderRepository,
        PaymentTransactionRepository transactionRepository,
        SpringDataAdminProductVariantJpaRepository variantRepository,
        PaymentGateway paymentGateway,
        @Value("${app.payment.mercadopago.base-url:https://api.mercadopago.com}") String baseUrl,
        PlatformTransactionManager transactionManager
    ) {
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.variantRepository = variantRepository;
        this.paymentGateway = paymentGateway;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.mercadoPagoRestClient = RestClient.builder()
            .requestFactory(factory)
            .baseUrl(baseUrl)
            .build();
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    /**
     * Ponto de entrada unico para processar um webhook do Mercado Pago.
     * Chamado tanto pelo controller (caminho sincrono) quanto pelo consumer AMQP.
     *
     * Fluxo: busca order na API MP → extrai dados → aplica transicao no banco
     * dentro de transacao curta (igual ao comportamento original).
     */
    public void process(String mercadoPagoOrderId) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Mercado Pago access token not configured");
        }

        // HTTP call FORA da transacao (igual ao original)
        Map<String, Object> mercadoPagoOrder = fetchMercadoPagoOrder(mercadoPagoOrderId);
        String checkoutSessionId = stringValue(mercadoPagoOrder, "external_reference");
        if (checkoutSessionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Mercado Pago external_reference missing");
        }

        Map<String, Object> payment = firstPayment(mercadoPagoOrder);
        String orderStatus = stringValue(mercadoPagoOrder, FIELD_STATUS);
        String paymentStatus = payment != null ? stringValue(payment, FIELD_STATUS) : orderStatus;
        String paymentStatusDetail = payment != null
            ? stringValue(payment, "status_detail")
            : stringValue(mercadoPagoOrder, "status_detail");
        String nextStatus = resolveLocalOrderStatus(orderStatus, paymentStatus);

        // DB updates DENTRO da transacao (igual ao transactionTemplate.execute original)
        transactionTemplate.execute(status -> {
            processWebhookOutcome(checkoutSessionId, mercadoPagoOrderId,
                payment, nextStatus, paymentStatusDetail);
            return null;
        });
    }

    // ---- metodos privados (identicos ao controller original) ----

    private Map<String, Object> fetchMercadoPagoOrder(String orderId) {
        try {
            return mercadoPagoRestClient.get()
                .uri("/v1/orders/{orderId}", orderId)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Erro ao consultar order no Mercado Pago");
                })
                .body(Map.class);
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                "Erro ao consultar order no Mercado Pago");
        }
    }

    private void processWebhookOutcome(
        String checkoutSessionId, String mercadoPagoOrderId,
        Map<String, Object> payment, String nextStatus, String paymentStatusDetail
    ) {
        CheckoutOrder order = orderRepository.findByCheckoutSessionId(checkoutSessionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Pedido local nao encontrado"));

        String previousStatus = order.getStatus();
        if (STATUS_CANCELLED.equals(previousStatus) && "paid".equals(nextStatus)) {
            refundPaymentReceivedAfterCancellation(order, mercadoPagoOrderId,
                payment, paymentStatusDetail);
            return;
        }

        if (!previousStatus.equals(nextStatus)) {
            order.setStatus(nextStatus);
            order.setUpdatedAt(Instant.now());
            orderRepository.save(order);
        }

        updatePaymentTransaction(order.getOrderId(), mercadoPagoOrderId,
            payment, nextStatus, paymentStatusDetail);

        if (STATUS_CANCELLED.equals(nextStatus) && "pending_payment".equals(previousStatus)) {
            releaseOrderStock(order);
            sendPaymentRejectedEmail(order, paymentStatusDetail);
        }

        if ("paid".equals(nextStatus) && !"paid".equals(previousStatus) && orderEventPublisher != null) {
            registerOrderCompletedSync(order, checkoutSessionId);
        }
    }

    private void registerOrderCompletedSync(CheckoutOrder order, String checkoutSessionId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                String messageId = UUID.randomUUID().toString();
                OrderCompletedEvent event = new OrderCompletedEvent(
                    messageId,
                    BaluarteAmqp.ORDER_COMPLETED,
                    order.getOrderId(),
                    checkoutSessionId,
                    order.getPayerEmail(),
                    Instant.now().toString()
                );
                try {
                    orderEventPublisher.publish(event);
                } catch (Exception e) {
                    log.warn("order.completed event=publish_failed orderId={} reason={}",
                        order.getOrderId(), e.getMessage());
                }
            }
        });
    }

    private void updatePaymentTransaction(String localOrderId, String providerOrderId,
            Map<String, Object> payment, String nextStatus, String statusDetail) {
        transactionRepository.findByOrderId(localOrderId).ifPresent(tx -> {
            String newStatus = "paid".equals(nextStatus) ? "approved" : nextStatus;
            if (newStatus.equals(tx.getStatus())
                && (statusDetail == null ? tx.getStatusDetail() == null
                                       : statusDetail.equals(tx.getStatusDetail()))) {
                return;
            }
            tx.setStatus(newStatus);
            tx.setStatusDetail(statusDetail);
            if (payment != null) {
                String providerPaymentId = stringValue(payment, "id");
                if (providerPaymentId != null) tx.setProviderPaymentId(providerPaymentId);
            }
            tx.setProviderOrderId(providerOrderId);
            transactionRepository.save(tx);
        });
    }

    private void refundPaymentReceivedAfterCancellation(CheckoutOrder order,
            String providerOrderId, Map<String, Object> payment, String statusDetail) {
        String providerPaymentId = payment != null ? stringValue(payment, "id") : null;
        if (providerPaymentId == null || providerPaymentId.isBlank()) {
            log.warn("Mercado Pago payment id missing for late refund, order={}", order.getOrderId());
            return;
        }

        PaymentTransaction transaction = transactionRepository.findByOrderId(order.getOrderId())
            .orElse(null);
        if (transaction == null) {
            log.warn("Transaction not found for late refund, order={}", order.getOrderId());
            return;
        }

        try {
            PaymentRefundResult refund = paymentGateway.refund(
                transaction.getProvider(),
                providerPaymentId,
                providerOrderId,
                "late-refund-" + order.getOrderId()
            );
            transaction.setProviderPaymentId(providerPaymentId);
            transaction.setProviderOrderId(providerOrderId);
            transaction.setStatus(refund.status() != null && !refund.status().isBlank()
                ? refund.status() : STATUS_REFUNDED);
            transaction.setStatusDetail(refund.statusDetail() != null && !refund.statusDetail().isBlank()
                ? refund.statusDetail()
                : "payment_received_after_cancellation_refunded");
            if (STATUS_REFUNDED.equals(transaction.getStatus())
                && statusDetail != null && !statusDetail.isBlank()) {
                transaction.setStatusDetail(transaction.getStatusDetail()
                    + "; original_status_detail=" + statusDetail);
            }
        } catch (PaymentValidationException exception) {
            log.warn("Late refund failed for order {}: {}",
                order.getOrderId(), exception.getMessage());
            transaction.setProviderPaymentId(providerPaymentId);
            transaction.setProviderOrderId(providerOrderId);
            transaction.setStatus("refund_failed");
            transaction.setStatusDetail("late_refund_failed: " + exception.getMessage());
        }
        transactionRepository.save(transaction);
    }

    private String resolveLocalOrderStatus(String orderStatus, String paymentStatus) {
        if (isAny(orderStatus, "processed", "paid")
            || isAny(paymentStatus, "processed", "approved")) {
            return "paid";
        }
        if (isAny(orderStatus, STATUS_CANCELLED, "canceled", "expired", "failed", STATUS_REFUNDED)
            || isAny(paymentStatus, STATUS_CANCELLED, "canceled", "expired", "failed",
                     "rejected", STATUS_REFUNDED)) {
            return STATUS_CANCELLED;
        }
        return "pending_payment";
    }

    private void releaseOrderStock(CheckoutOrder order) {
        if (order.getItems() == null) return;
        for (var item : order.getItems()) {
            try {
                UUID productId = UUID.fromString(item.getProductId());
                variantRepository.releaseStock(productId, item.getSize(), item.getQuantity());
            } catch (IllegalArgumentException ignored) {
                // Invalid historic item ids should not break webhook acknowledgement.
            }
        }
    }

    private void sendPaymentRejectedEmail(CheckoutOrder order, String statusDetail) {
        if (emailService == null) return;
        try {
            emailService.sendPaymentRejected(order, PaymentRejectionMessages.translate(statusDetail));
        } catch (Exception e) {
            log.warn("email.payment_rejected send_failed orderId={} reason={}",
                order.getOrderId(), e.getMessage());
        }
    }

    private Map<String, Object> firstPayment(Map<String, Object> response) {
        Map<String, Object> transactions = (Map<String, Object>) response.get("transactions");
        if (transactions == null) return null;
        List<Map<String, Object>> payments =
            (List<Map<String, Object>>) transactions.get("payments");
        return payments == null || payments.isEmpty() ? null : payments.get(0);
    }

    private boolean isAny(String value, String... options) {
        if (value == null) return false;
        for (String option : options) {
            if (option.equalsIgnoreCase(value)) return true;
        }
        return false;
    }

    private String stringValue(Map<String, Object> body, String key) {
        if (body == null) return null;
        Object value = body.get(key);
        return value == null ? null : String.valueOf(value);
    }
}
