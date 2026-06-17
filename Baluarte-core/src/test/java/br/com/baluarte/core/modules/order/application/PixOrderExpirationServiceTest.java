package br.com.baluarte.core.modules.order.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PixOrderExpirationServiceTest {

    @Mock
    private CheckoutOrderRepository orderRepository;

    @Mock
    private SpringDataAdminProductVariantJpaRepository variantRepository;

    private PixOrderExpirationService service;

    @BeforeEach
    void setUp() {
        service = new PixOrderExpirationService(orderRepository, variantRepository);
    }

    @Test
    void doesNotExpireNonPendingPaymentOrder() {
        CheckoutOrder order = order("paid", Instant.now());

        CheckoutOrder result = service.expireIfNeeded(order);

        assertThat(result.getStatus()).isEqualTo("paid");
        verifyNoInteractions(orderRepository, variantRepository);
    }

    @Test
    void doesNotExpirePendingPaymentOrderWithNullCreatedAt() {
        CheckoutOrder order = order("pending_payment", null);

        CheckoutOrder result = service.expireIfNeeded(order);

        assertThat(result.getStatus()).isEqualTo("pending_payment");
        verifyNoInteractions(orderRepository, variantRepository);
    }

    @Test
    void doesNotExpireRecentPendingPaymentOrder() {
        CheckoutOrder order = order("pending_payment", Instant.now());

        CheckoutOrder result = service.expireIfNeeded(order);

        assertThat(result.getStatus()).isEqualTo("pending_payment");
        verifyNoInteractions(orderRepository, variantRepository);
    }

    @Test
    void expiresOldPendingPaymentOrderAndReleasesStock() {
        CheckoutOrder order = order("pending_payment", Instant.now().minus(Duration.ofMinutes(15)));
        UUID productId = UUID.randomUUID();
        order.setItems(List.of(
            new CheckoutOrderItem("item-1", order.getOrderId(), productId.toString(), "Camisa", "M", 2, BigDecimal.TEN)
        ));
        when(orderRepository.save(order)).thenReturn(order);

        CheckoutOrder result = service.expireIfNeeded(order);

        assertThat(result.getStatus()).isEqualTo("cancelled");
        verify(orderRepository).save(order);
        verify(variantRepository).releaseStock(productId, "M", 2);
    }

    @Test
    void handlesInvalidProductIdWhenReleasingStock() {
        CheckoutOrder order = order("pending_payment", Instant.now().minus(Duration.ofMinutes(15)));
        order.setItems(List.of(
            new CheckoutOrderItem("item-1", order.getOrderId(), "not-a-uuid", "Camisa", "M", 2, BigDecimal.TEN)
        ));
        when(orderRepository.save(order)).thenReturn(order);

        CheckoutOrder result = service.expireIfNeeded(order);

        assertThat(result.getStatus()).isEqualTo("cancelled");
        verify(orderRepository).save(order);
        verify(variantRepository, never()).releaseStock(any(), any(), anyInt());
    }

    @Test
    void expirePendingPixOrdersFetchesAndProcessesBatch() {
        CheckoutOrder stale = order("pending_payment", Instant.now().minus(Duration.ofMinutes(15)));
        CheckoutOrder recent = order("pending_payment", Instant.now());
        when(orderRepository.findPendingPaymentCreatedBefore(any(Instant.class), anyInt()))
            .thenReturn(List.of(stale, recent));
        when(orderRepository.save(stale)).thenReturn(stale);

        service.expirePendingPixOrders();

        verify(orderRepository).save(stale);
        assertThat(stale.getStatus()).isEqualTo("cancelled");
        assertThat(recent.getStatus()).isEqualTo("pending_payment");
    }

    @Test
    void expirePendingPixOrdersDoesNothingWhenNoOrders() {
        when(orderRepository.findPendingPaymentCreatedBefore(any(Instant.class), anyInt()))
            .thenReturn(List.of());

        service.expirePendingPixOrders();

        verifyNoInteractions(variantRepository);
    }

    private CheckoutOrder order(String status, Instant createdAt) {
        CheckoutOrder order = new CheckoutOrder(
            UUID.randomUUID().toString(), "session-1", "cust-1", "user-1",
            "test@test.com", "CPF", "12345678909", "Test",
            status, BigDecimal.valueOf(100), BigDecimal.ZERO,
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP"
        );
        order.setCreatedAt(createdAt);
        return order;
    }
}
