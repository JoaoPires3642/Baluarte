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
import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.ZonedDateTime;
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
        validateCpf(request.payer().identification().type(), request.payer().identification().number());

        if ("uber".equals(request.shippingType())) {
            validateUberDeliveryTime();
        }

        Optional<PaymentTransaction> existingTx = 
            transactionRepository.findByIdempotencyKey(request.idempotencyKey());
        
        if (existingTx.isPresent()) {
            PaymentTransaction tx = existingTx.get();
            Long existingOrderNumber = orderRepository.findById(tx.getOrderId())
                .map(CheckoutOrder::getOrderNumber)
                .orElse(null);
            return mapToResponse(tx, provider, request.method(), existingOrderNumber);
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
        order.setShippingServiceId(request.shipping().optionId());
        order.setShippingServiceName(request.shipping().label());
        order.setShippingType(request.shippingType() != null ? request.shippingType() : "delivery");
        order.setDeliveryStation(request.deliveryStation());
        order.setDeliveryDay(request.deliveryDay());
        order.setDeliveryDate(request.deliveryDate());
        order.setDeliveryTimeSlot(request.deliveryTimeSlot());
        order = orderRepository.save(order);

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
        transaction.setProviderOrderId(result.providerOrderId());
        transaction.setStatusDetail(result.statusDetail());
        transaction.setInstallments(result.installments());
        if (result.pixQrCode() != null) {
            transaction.setPixQrCode(result.pixQrCode());
            transaction.setPixQrCodeBase64(result.pixQrCodeBase64());
        }
        transactionRepository.save(transaction);

        order.setPaymentReference(paymentId);
        order.setStatus(resolveOrderStatus(result.status()));
        order = orderRepository.save(order);

        return mapToResponse(transaction, provider, request.method(), order.getOrderNumber());
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

    private void validateCpf(String type, String number) {
        if (!"CPF".equalsIgnoreCase(type)) return;
        String cpf = number == null ? "" : number.replaceAll("\\D", "");
        if (cpf.length() != 11 || cpf.chars().distinct().count() == 1) {
            throw new PaymentValidationException("CPF invalido");
        }

        int firstDigit = calculateCpfDigit(cpf.substring(0, 9), 10);
        int secondDigit = calculateCpfDigit(cpf.substring(0, 10), 11);
        if (Character.digit(cpf.charAt(9), 10) != firstDigit || Character.digit(cpf.charAt(10), 10) != secondDigit) {
            throw new PaymentValidationException("CPF invalido");
        }
    }

    private int calculateCpfDigit(String numbers, int startWeight) {
        int sum = 0;
        for (int i = 0; i < numbers.length(); i++) {
            sum += Character.digit(numbers.charAt(i), 10) * (startWeight - i);
        }
        int remainder = (sum * 10) % 11;
        return remainder == 10 ? 0 : remainder;
    }

    private record ResolvedItem(String productId, String productName, String size, int quantity, BigDecimal unitPrice) {}

    private void validateUberDeliveryTime() {
        ZonedDateTime now = ZonedDateTime.now(ZoneId.of("America/Sao_Paulo"));
        DayOfWeek day = now.getDayOfWeek();
        int hour = now.getHour();
        int minute = now.getMinute();

        if (day == DayOfWeek.SUNDAY) {
            throw new PaymentValidationException("Entrega via Uber nao disponivel aos domingos");
        }
        if (day == DayOfWeek.SATURDAY && (hour > 14 || (hour == 14 && minute > 0))) {
            throw new PaymentValidationException("Entrega via Uber disponivel apenas ate as 14:00 aos sabados");
        }
        if (day != DayOfWeek.SATURDAY && (hour > 19 || (hour == 19 && minute > 0))) {
            throw new PaymentValidationException("Entrega via Uber disponivel apenas ate as 19:00 de segunda a sexta");
        }
    }

    private CreatePaymentResponse mapToResponse(PaymentTransaction tx, String provider, String method, Long orderNumber) {
        PixPayload pix = null;
        if (tx.getPixQrCode() != null) {
            pix = new PixPayload(tx.getPixQrCode(), tx.getPixQrCodeBase64(), tx.getPixQrCode());
        }
        return new CreatePaymentResponse(
            tx.getPaymentId(),
            tx.getOrderId(),
            orderNumber != null ? "BAL" + orderNumber : tx.getOrderId(),
            provider,
            method,
            tx.getStatus(),
            tx.getStatusDetail(),
            tx.getInstallments(),
            pix
        );
    }
}
