package br.com.baluarte.core.modules.payment.application;

import br.com.baluarte.core.modules.payment.api.CreatePaymentRequest;
import br.com.baluarte.core.modules.payment.api.CreatePaymentResponse;
import br.com.baluarte.core.modules.payment.api.CreatePaymentResponse.PixPayload;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class CreatePaymentUseCase {

    private final PaymentGateway paymentGateway;
    private final CheckoutOrderRepository orderRepository;
    private final PaymentTransactionRepository transactionRepository;

    public CreatePaymentUseCase(
        PaymentGateway paymentGateway,
        CheckoutOrderRepository orderRepository,
        PaymentTransactionRepository transactionRepository
    ) {
        this.paymentGateway = paymentGateway;
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
    }

    public CreatePaymentResponse execute(CreatePaymentRequest request, String provider) {
        Optional<PaymentTransaction> existingTx = 
            transactionRepository.findByIdempotencyKey(request.idempotencyKey());
        
        if (existingTx.isPresent()) {
            PaymentTransaction tx = existingTx.get();
            return mapToResponse(tx, provider, request.method());
        }

        BigDecimal totalAmount = request.items().stream()
            .map(item -> item.unitPrice().multiply(BigDecimal.valueOf(item.quantity())))
            .reduce(BigDecimal.ZERO, (a, b) -> a.add(b))
            .add(request.shipping().price());

        String orderId = "ord-" + UUID.randomUUID().toString();
        String paymentId = "pay-" + UUID.randomUUID().toString();

        CheckoutOrder order = new CheckoutOrder(
            orderId,
            request.checkoutSessionId(),
            request.payer().email(),
            "pending",
            totalAmount,
            request.shipping().price(),
            request.shippingAddress().cep(),
            request.shippingAddress().street(),
            request.shippingAddress().number(),
            request.shippingAddress().neighborhood(),
            request.shippingAddress().city(),
            request.shippingAddress().state()
        );
        orderRepository.save(order);

        CreatePaymentCommand command = new CreatePaymentCommand(
            request.checkoutSessionId(),
            request.idempotencyKey(),
            request.method(),
            request.payer().email(),
            request.payer().identification().type(),
            request.payer().identification().number(),
            request.shippingAddress().cep(),
            request.shippingAddress().street(),
            request.shippingAddress().number(),
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
        order.setStatus("pending");
        orderRepository.save(order);

        return mapToResponse(transaction, provider, request.method());
    }

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