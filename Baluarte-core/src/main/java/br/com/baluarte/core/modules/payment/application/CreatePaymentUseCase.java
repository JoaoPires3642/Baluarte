package br.com.baluarte.core.modules.payment.application;

import br.com.baluarte.core.modules.adminproduct.infrastructure.AdminProductJpaEntity;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductJpaRepository;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.api.CreatePaymentRequest;
import br.com.baluarte.core.modules.payment.api.CreatePaymentResponse;
import br.com.baluarte.core.modules.payment.api.CreatePaymentResponse.PixPayload;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CreatePaymentUseCase {

    private final PaymentGateway paymentGateway;
    private final CheckoutOrderRepository orderRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final SpringDataAdminProductJpaRepository productRepository;
    private final SpringDataAdminProductVariantJpaRepository variantRepository;

    public CreatePaymentUseCase(
        PaymentGateway paymentGateway,
        CheckoutOrderRepository orderRepository,
        PaymentTransactionRepository transactionRepository,
        SpringDataAdminProductJpaRepository productRepository,
        SpringDataAdminProductVariantJpaRepository variantRepository
    ) {
        this.paymentGateway = paymentGateway;
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
    }

    @Transactional
    public CreatePaymentResponse execute(CreatePaymentRequest request, String provider, String clerkUserId) {
        Optional<PaymentTransaction> existingTx = 
            transactionRepository.findByIdempotencyKey(request.idempotencyKey());
        
        if (existingTx.isPresent()) {
            PaymentTransaction tx = existingTx.get();
            return mapToResponse(tx, provider, request.method());
        }

        List<ResolvedItem> resolvedItems = request.items().stream()
            .map(this::resolveAndReserveItem)
            .toList();
        BigDecimal totalAmount = resolvedItems.stream()
            .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .add(request.shipping().price());

        String orderId = UUID.randomUUID().toString();
        String paymentId = UUID.randomUUID().toString();

        CheckoutOrder order = new CheckoutOrder(
            orderId,
            request.checkoutSessionId(),
            request.payer().email(),
            clerkUserId,
            request.payer().email(),
            request.payer().identification().type(),
            request.payer().identification().number(),
            request.shippingAddress().recipientName(),
            "pending_payment",
            totalAmount,
            request.shipping().price(),
            request.shippingAddress().cep(),
            request.shippingAddress().street(),
            request.shippingAddress().number(),
            request.shippingAddress().complement(),
            request.shippingAddress().neighborhood(),
            request.shippingAddress().city(),
            request.shippingAddress().state()
        );
        order.setItems(resolvedItems.stream()
            .map(item -> new CheckoutOrderItem(
                UUID.randomUUID().toString(),
                orderId,
                item.productId(),
                item.productName(),
                item.size(),
                item.quantity(),
                item.unitPrice()
            ))
            .toList());
        orderRepository.save(order);

        CreatePaymentCommand command = new CreatePaymentCommand(
            request.checkoutSessionId(),
            request.idempotencyKey(),
            request.method(),
            request.payer().email(),
            request.payer().identification().type(),
            request.payer().identification().number(),
            clerkUserId,
            request.shippingAddress().recipientName(),
            request.shippingAddress().cep(),
            request.shippingAddress().street(),
            request.shippingAddress().number(),
            request.shippingAddress().complement(),
            request.shippingAddress().neighborhood(),
            request.shippingAddress().city(),
            request.shippingAddress().state(),
            request.shipping().price(),
            totalAmount,
            request.card() != null ? request.card().token() : null,
            request.card() != null ? request.card().paymentMethodId() : null,
            request.card() != null ? request.card().issuerId() : null,
            request.card() != null ? request.card().installments() : null
        );

        PaymentGatewayResult result = paymentGateway.create(command);
        if ("rejected".equalsIgnoreCase(result.status())) {
            resolvedItems.forEach(item -> variantRepository.releaseStock(parseProductId(item.productId()), item.size(), item.quantity()));
        }

        PaymentTransaction transaction = new PaymentTransaction(
            paymentId,
            orderId,
            provider,
            request.method(),
            totalAmount,
            result.status(),
            request.idempotencyKey()
        );
        transaction.setProviderPaymentId(result.providerPaymentId());
        transaction.setStatusDetail(result.statusDetail());
        transaction.setInstallments(result.installments());
        if (result.pixQrCode() != null) {
            transaction.setPixQrCode(result.pixQrCode());
            transaction.setPixQrCodeBase64(result.pixQrCodeBase64());
        }
        transactionRepository.save(transaction);

        order.setPaymentReference(paymentId);
        order.setStatus(resolveOrderStatus(result.status()));
        orderRepository.save(order);

        return mapToResponse(transaction, provider, request.method());
    }

    private String resolveOrderStatus(String paymentStatus) {
        if ("approved".equalsIgnoreCase(paymentStatus)) {
            return "paid";
        }
        if ("rejected".equalsIgnoreCase(paymentStatus)) {
            return "cancelled";
        }
        return "pending_payment";
    }

    private ResolvedItem resolveAndReserveItem(CreatePaymentRequest.Item item) {
        UUID productId = parseProductId(item.productId());
        AdminProductJpaEntity product = productRepository.findById(productId)
            .filter(candidate -> Boolean.TRUE.equals(candidate.getActive()) && Boolean.TRUE.equals(candidate.getAvailable()))
            .orElseThrow(() -> new PaymentValidationException("Produto indisponivel"));

        int updatedRows = variantRepository.reserveStock(productId, item.size(), item.quantity());
        if (updatedRows == 0) {
            throw new PaymentValidationException("Estoque insuficiente para " + product.getModelName() + " tamanho " + item.size());
        }

        return new ResolvedItem(product.getId().toString(), product.getModelName(), item.size().toUpperCase(), item.quantity(), product.getPrice());
    }

    private UUID parseProductId(String productId) {
        try {
            return UUID.fromString(productId);
        } catch (IllegalArgumentException exception) {
            throw new PaymentValidationException("Produto invalido");
        }
    }

    private record ResolvedItem(String productId, String productName, String size, int quantity, BigDecimal unitPrice) {}

    private CreatePaymentResponse mapToResponse(PaymentTransaction tx, String provider, String method) {
        PixPayload pix = null;
        if (tx.getPixQrCode() != null) {
            pix = new PixPayload(tx.getPixQrCode(), tx.getPixQrCodeBase64(), tx.getPixQrCode());
        }
        return new CreatePaymentResponse(
            tx.getPaymentId(),
            tx.getOrderId(),
            provider,
            method,
            tx.getStatus(),
            tx.getStatusDetail(),
            tx.getInstallments(),
            pix
        );
    }
}
