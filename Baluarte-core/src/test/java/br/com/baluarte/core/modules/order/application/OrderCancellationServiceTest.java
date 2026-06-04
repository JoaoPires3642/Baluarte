package br.com.baluarte.core.modules.order.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.checkout.infrastructure.SuperFreteShippingLabelService;
import br.com.baluarte.core.modules.payment.application.PaymentGateway;
import br.com.baluarte.core.modules.payment.application.PaymentRefundResult;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrderCancellationServiceTest {

    @Mock
    private CheckoutOrderRepository orderRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private SpringDataAdminProductVariantJpaRepository variantRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private SuperFreteShippingLabelService shippingLabelService;

    private OrderCancellationService service;

    @BeforeEach
    void setUp() {
        service = new OrderCancellationService(
            orderRepository,
            paymentTransactionRepository,
            variantRepository,
            paymentGateway,
            shippingLabelService
        );
    }

    @Test
    void customerCannotCancelProcessingOrder() {
        CheckoutOrder order = order("processing");

        assertThatThrownBy(() -> service.cancelByCustomer(order))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Pedido nao pode ser cancelado neste status");

        verifyNoInteractions(orderRepository, paymentGateway, shippingLabelService, variantRepository);
    }

    @Test
    void adminCannotCancelShippedOrder() {
        CheckoutOrder order = order("shipped");

        assertThatThrownBy(() -> service.cancelByAdmin(order))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Pedido nao pode ser cancelado neste status");

        verifyNoInteractions(orderRepository, paymentGateway, shippingLabelService, variantRepository);
    }

    @Test
    void cancelsPaidOrderRefundsPaymentCancelsLabelAndReleasesStock() {
        CheckoutOrder order = order("paid");
        order.setShippingLabelId("sf-123");
        UUID productId = UUID.randomUUID();
        order.setItems(List.of(new CheckoutOrderItem("item-1", order.getOrderId(), productId.toString(), "Camisa", "M", 2, BigDecimal.TEN)));
        PaymentTransaction transaction = transaction(order.getOrderId(), "approved");

        when(paymentTransactionRepository.findByOrderId(order.getOrderId())).thenReturn(Optional.of(transaction));
        when(paymentGateway.refund("mercadopago", "mp-123", "mp-order-123", "refund-" + order.getOrderId()))
            .thenReturn(new PaymentRefundResult("refunded", "refunded_by_test"));
        when(orderRepository.save(order)).thenReturn(order);

        CheckoutOrder cancelled = service.cancelByAdmin(order);

        assertThat(cancelled.getStatus()).isEqualTo("cancelled");
        assertThat(transaction.getStatus()).isEqualTo("refunded");
        assertThat(transaction.getStatusDetail()).isEqualTo("refunded_by_test");
        verify(paymentGateway).refund("mercadopago", "mp-123", "mp-order-123", "refund-" + order.getOrderId());
        verify(paymentTransactionRepository).save(transaction);
        verify(shippingLabelService).cancelLabel("sf-123", "Pedido " + order.getOrderId() + " cancelado");
        verify(variantRepository).releaseStock(productId, "M", 2);
        verify(orderRepository).save(order);
    }

    @Test
    void doesNotCancelOrderWhenRefundFails() {
        CheckoutOrder order = order("paid");
        PaymentTransaction transaction = transaction(order.getOrderId(), "approved");

        when(paymentTransactionRepository.findByOrderId(order.getOrderId())).thenReturn(Optional.of(transaction));
        when(paymentGateway.refund("mercadopago", "mp-123", "mp-order-123", "refund-" + order.getOrderId()))
            .thenThrow(new IllegalStateException("refund failed"));

        assertThatThrownBy(() -> service.cancelByAdmin(order))
            .isInstanceOf(IllegalStateException.class)
            .hasMessage("refund failed");

        assertThat(order.getStatus()).isEqualTo("paid");
        verify(orderRepository, never()).save(order);
        verifyNoInteractions(shippingLabelService, variantRepository);
    }

    private CheckoutOrder order(String status) {
        return new CheckoutOrder(
            UUID.randomUUID().toString(),
            "session-1",
            "cliente@baluarte.com",
            "user-1",
            "cliente@baluarte.com",
            "CPF",
            "12345678909",
            "Joao Cliente",
            status,
            BigDecimal.valueOf(199.90),
            BigDecimal.valueOf(19.90),
            "01001000",
            "Rua A",
            "100",
            null,
            "Centro",
            "Sao Paulo",
            "SP"
        );
    }

    private PaymentTransaction transaction(String orderId, String status) {
        PaymentTransaction transaction = new PaymentTransaction(
            UUID.randomUUID().toString(),
            orderId,
            "mercadopago",
            "credit_card",
            BigDecimal.valueOf(199.90),
            status,
            "payment-key-1"
        );
        transaction.setProviderPaymentId("mp-123");
        transaction.setProviderOrderId("mp-order-123");
        return transaction;
    }
}
