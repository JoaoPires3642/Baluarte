package br.com.baluarte.core.modules.order.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.checkout.infrastructure.SuperFreteShippingLabelService;
import br.com.baluarte.core.modules.checkout.infrastructure.SuperFreteShippingLabelService.ShippingLabelResult;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ShippingLabelGenerationServiceTest {

    @Mock
    private CheckoutOrderRepository orderRepository;

    @Mock
    private SuperFreteShippingLabelService shippingLabelService;

    private ShippingLabelGenerationService service;

    @BeforeEach
    void setUp() {
        service = new ShippingLabelGenerationService(orderRepository, shippingLabelService);
    }

    @Test
    void stationOrderOnlyUpdatesStatus() {
        CheckoutOrder order = order("paid", "station", null, null);
        when(orderRepository.save(order)).thenReturn(order);

        CheckoutOrder result = service.generateForOrder(order);

        assertThat(result.getStatus()).isEqualTo("processing");
        verifyNoInteractions(shippingLabelService);
    }

    @Test
    void nonStationWithoutLabelCreatesCartAndEmitsLabel() {
        CheckoutOrder order = order("paid", "delivery", null, null);
        ShippingLabelResult cart = new ShippingLabelResult("cart-123", null, null);
        ShippingLabelResult emitted = new ShippingLabelResult("label-456", "https://url/label", "TRACK123");
        when(shippingLabelService.createCartLabel(order)).thenReturn(cart);
        when(shippingLabelService.emitLabel("cart-123")).thenReturn(emitted);
        when(orderRepository.save(order)).thenReturn(order);

        CheckoutOrder result = service.generateForOrder(order);

        assertThat(result.getShippingProvider()).isEqualTo("superfrete");
        assertThat(result.getShippingLabelId()).isEqualTo("label-456");
        assertThat(result.getShippingLabelUrl()).isEqualTo("https://url/label");
        assertThat(result.getTrackingCode()).isEqualTo("TRACK123");
        assertThat(result.getStatus()).isEqualTo("processing");
    }

    @Test
    void nonStationWithLabelIdEmitsLabelWithoutTracking() {
        CheckoutOrder order = order("paid", "delivery", "sf-123", null);
        ShippingLabelResult emitted = new ShippingLabelResult("new-id", "https://url/label", null);
        when(shippingLabelService.emitLabel("sf-123")).thenReturn(emitted);
        when(orderRepository.save(order)).thenReturn(order);

        CheckoutOrder result = service.generateForOrder(order);

        assertThat(result.getShippingLabelId()).isEqualTo("new-id");
        assertThat(result.getShippingLabelUrl()).isEqualTo("https://url/label");
        assertThat(result.getStatus()).isEqualTo("processing");
    }

    @Test
    void nonStationWithLabelAndUrlGetsTrackingInfo() {
        CheckoutOrder order = order("paid", "delivery", "sf-123", "https://url/label");
        ShippingLabelResult info = new ShippingLabelResult("sf-123", null, "TRACK456");
        when(shippingLabelService.getLabelInfo("sf-123")).thenReturn(info);
        when(orderRepository.save(order)).thenReturn(order);

        CheckoutOrder result = service.generateForOrder(order);

        assertThat(result.getTrackingCode()).isEqualTo("TRACK456");
        assertThat(result.getStatus()).isEqualTo("processing");
    }

    @Test
    void nonStationWithAllFieldsJustSaves() {
        CheckoutOrder order = order("paid", "delivery", "sf-123", "https://url/label");
        order.setTrackingCode("TRACK789");
        when(orderRepository.save(order)).thenReturn(order);

        CheckoutOrder result = service.generateForOrder(order);

        assertThat(result.getStatus()).isEqualTo("processing");
        verifyNoInteractions(shippingLabelService);
    }

    @Test
    void generatePendingProcessesEligibleOrders() {
        CheckoutOrder eligible = order("paid", "delivery", null, null);
        when(orderRepository.findByStatusIn(List.of("paid", "processing")))
            .thenReturn(List.of(eligible));
        ShippingLabelResult cart = new ShippingLabelResult("cart-1", null, null);
        ShippingLabelResult emitted = new ShippingLabelResult("label-1", "https://url", "TRK1");
        when(shippingLabelService.createCartLabel(eligible)).thenReturn(cart);
        when(shippingLabelService.emitLabel("cart-1")).thenReturn(emitted);
        when(orderRepository.save(eligible)).thenReturn(eligible);

        BulkShippingLabelGenerationResult result = service.generatePending(null);

        assertThat(result.candidates()).isEqualTo(1);
        assertThat(result.generated()).isEqualTo(1);
        assertThat(result.failures()).isEmpty();
    }

    @Test
    void generatePendingSkipsStationOrders() {
        CheckoutOrder station = order("paid", "station", null, null);
        when(orderRepository.findByStatusIn(List.of("paid", "processing")))
            .thenReturn(List.of(station));

        BulkShippingLabelGenerationResult result = service.generatePending(null);

        assertThat(result.candidates()).isEqualTo(0);
        assertThat(result.generated()).isEqualTo(0);
        verifyNoInteractions(shippingLabelService);
    }

    @Test
    void generatePendingCollectsFailures() {
        CheckoutOrder failing = order("paid", "delivery", null, null);
        failing.setItems(List.of(
            new CheckoutOrderItem("i1", failing.getOrderId(), "p1", "Camisa", "M", 2, BigDecimal.TEN)
        ));
        failing.setPayerDocumentNumber("12345678909");
        failing.setShippingStreet("Rua A");
        failing.setShippingNumber("100");
        failing.setShippingNeighborhood("Centro");
        failing.setShippingCity("SP");
        failing.setShippingState("SP");
        failing.setShippingCep("01001000");
        when(orderRepository.findByStatusIn(List.of("paid", "processing")))
            .thenReturn(List.of(failing));
        when(shippingLabelService.createCartLabel(failing))
            .thenThrow(new IllegalStateException("SuperFrete token not configured"));

        BulkShippingLabelGenerationResult result = service.generatePending(null);

        assertThat(result.candidates()).isEqualTo(1);
        assertThat(result.generated()).isEqualTo(0);
        assertThat(result.failures()).hasSize(1);
        assertThat(result.failures().getFirst().orderId()).isEqualTo(failing.getOrderId());
        assertThat(result.failures().getFirst().message()).contains("SuperFrete token not configured");
    }

    @Test
    void generatePendingFiltersByCreatedBefore() {
        CheckoutOrder oldOrder = order("paid", "delivery", null, null);
        oldOrder.setCreatedAt(Instant.parse("2026-06-01T10:00:00Z"));
        CheckoutOrder newOrder = order("paid", "delivery", null, null);
        newOrder.setCreatedAt(Instant.parse("2026-06-15T10:00:00Z"));
        when(orderRepository.findByStatusIn(List.of("paid", "processing")))
            .thenReturn(List.of(oldOrder, newOrder));
        ShippingLabelResult cart = new ShippingLabelResult("cart-1", null, null);
        ShippingLabelResult emitted = new ShippingLabelResult("label-1", "https://url", "TRK1");
        when(shippingLabelService.createCartLabel(oldOrder)).thenReturn(cart);
        when(shippingLabelService.emitLabel("cart-1")).thenReturn(emitted);
        when(orderRepository.save(oldOrder)).thenReturn(oldOrder);

        BulkShippingLabelGenerationResult result = service.generatePending(
            Instant.parse("2026-06-10T10:00:00Z"));

        assertThat(result.candidates()).isEqualTo(1);
    }

    @Test
    void generatePendingSkipsOrderWithExistingUrl() {
        CheckoutOrder hasUrl = order("paid", "delivery", "sf-1", "https://url");
        when(orderRepository.findByStatusIn(List.of("paid", "processing")))
            .thenReturn(List.of(hasUrl));

        BulkShippingLabelGenerationResult result = service.generatePending(null);

        assertThat(result.candidates()).isEqualTo(0);
    }

    private CheckoutOrder order(String status, String shippingType, String labelId, String labelUrl) {
        CheckoutOrder order = new CheckoutOrder(
            UUID.randomUUID().toString(), "session-1", "cust-1", "user-1",
            "test@test.com", "CPF", "12345678909", "Recipient",
            status, BigDecimal.valueOf(100), BigDecimal.ZERO,
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP"
        );
        order.setShippingType(shippingType);
        order.setShippingLabelId(labelId);
        order.setShippingLabelUrl(labelUrl);
        return order;
    }
}
