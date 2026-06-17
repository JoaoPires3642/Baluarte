package br.com.baluarte.core.modules.order.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.api.UpdateOrderStatusRequest;
import br.com.baluarte.core.modules.order.application.BulkShippingLabelGenerationFailure;
import br.com.baluarte.core.modules.order.application.BulkShippingLabelGenerationResult;
import br.com.baluarte.core.modules.order.application.OrderCancellationService;
import br.com.baluarte.core.modules.order.application.PixOrderExpirationService;
import br.com.baluarte.core.modules.order.application.ShippingLabelGenerationService;
import br.com.baluarte.core.modules.payment.application.PaymentValidationException;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.InternalRole;
import br.com.baluarte.core.shared.auth.InternalRoleResolver;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock private CheckoutOrderRepository orderRepository;
    @Mock private PaymentTransactionRepository paymentTransactionRepository;
    @Mock private InternalRoleResolver internalRoleResolver;
    @Mock private PixOrderExpirationService pixOrderExpirationService;
    @Mock private ShippingLabelGenerationService shippingLabelGenerationService;
    @Mock private OrderCancellationService orderCancellationService;

    private OrderController controller;

    @BeforeEach
    void setUp() {
        controller = new OrderController(orderRepository, paymentTransactionRepository,
            internalRoleResolver, pixOrderExpirationService,
            shippingLabelGenerationService, orderCancellationService);
        lenient().when(internalRoleResolver.resolveFromIdentity(any(), any()))
            .thenReturn(InternalRole.ADMIN);
        lenient().when(pixOrderExpirationService.expireIfNeeded(any()))
            .thenAnswer(i -> i.getArgument(0));
    }

    // ---- listOrders ----

    @Test
    void listOrdersReturnsPagedResults() {
        CheckoutOrder o1 = order("o1", "paid");
        CheckoutOrder o2 = order("o2", "processing");
        when(orderRepository.countAll()).thenReturn(2L);
        when(orderRepository.findAll(0, 30)).thenReturn(List.of(o1, o2));

        ApiSuccessResponse<List<OrderResponse>> response = controller.listOrders(0, 30, "uid", "e@m.com");

        assertThat(response.data()).hasSize(2);
        assertThat(response.meta()).containsEntry("page", 0).containsEntry("total", 2L);
    }

    @Test
    void listOrdersClampsPageAndSize() {
        when(orderRepository.countAll()).thenReturn(0L);
        when(orderRepository.findAll(0, 100)).thenReturn(List.of());

        controller.listOrders(-5, 500, "uid", "e@m.com");
    }

    @Test
    void listOrdersThrowsWhenUserIdMissing() {
        assertThatThrownBy(() -> controller.listOrders(0, 30, null, "e@m.com"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.UNAUTHORIZED);
    }

    @Test
    void listOrdersThrowsWhenNotAdmin() {
        when(internalRoleResolver.resolveFromIdentity(any(), any()))
            .thenReturn(InternalRole.CUSTOMER);

        assertThatThrownBy(() -> controller.listOrders(0, 30, "uid", "e@m.com"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.FORBIDDEN);
    }

    // ---- listMyOrders ----

    @Test
    void listMyOrdersReturnsUserOrders() {
        CheckoutOrder o1 = order("o1", "paid");
        when(orderRepository.findByUserId("uid")).thenReturn(List.of(o1));

        ApiSuccessResponse<List<OrderResponse>> response = controller.listMyOrders("uid");

        assertThat(response.data()).hasSize(1);
    }

    // ---- getOrder ----

    @Test
    void getOrderReturnsFoundOrder() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.of(order));

        ApiSuccessResponse<OrderResponse> response = controller.getOrder("o1", "uid", "e@m.com");

        assertThat(response.data().id()).isEqualTo("o1");
    }

    @Test
    void getOrderThrowsWhenNotFound() {
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> controller.getOrder("o1", "uid", "e@m.com"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.NOT_FOUND);
    }

    // ---- listStationDeliveries ----

    @Test
    void listStationDeliveriesReturnsResults() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findStationDeliveriesByDate("2026-06-17"))
            .thenReturn(List.of(order));

        ApiSuccessResponse<List<OrderResponse>> response = controller.listStationDeliveries(
            "2026-06-17", "uid", "e@m.com");

        assertThat(response.data()).hasSize(1);
    }

    // ---- listSeparationReport ----

    @Test
    void listSeparationReportReturnsResults() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findSeparationReportByCreatedDate(LocalDate.parse("2026-06-17")))
            .thenReturn(List.of(order));

        ApiSuccessResponse<List<OrderResponse>> response = controller.listSeparationReport(
            "2026-06-17", "uid", "e@m.com");

        assertThat(response.data()).hasSize(1);
    }

    // ---- getMyOrder ----

    @Test
    void getMyOrderReturnsFoundOrder() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findByIdAndUserId("o1", "uid"))
            .thenReturn(java.util.Optional.of(order));

        ApiSuccessResponse<OrderResponse> response = controller.getMyOrder("o1", "uid");

        assertThat(response.data().id()).isEqualTo("o1");
    }

    @Test
    void getMyOrderThrowsWhenNotFound() {
        when(orderRepository.findByIdAndUserId("o1", "uid"))
            .thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> controller.getMyOrder("o1", "uid"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.NOT_FOUND);
    }

    // ---- updateOrderStatus ----

    @Test
    void updateOrderStatusChangesStatus() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.of(order));

        ApiSuccessResponse<OrderResponse> response = controller.updateOrderStatus(
            "o1", new UpdateOrderStatusRequest("processing"), "uid", "e@m.com");

        assertThat(response.data().status()).isEqualTo("processing");
    }

    @Test
    void updateOrderStatusThrowsOnInvalidStatus() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.of(order));

        assertThatThrownBy(() -> controller.updateOrderStatus(
            "o1", new UpdateOrderStatusRequest("invalid-status"), "uid", "e@m.com"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateOrderStatusCancelsViaAdmin() {
        CheckoutOrder order = order("o1", "paid");
        CheckoutOrder cancelled = order("o1", "cancelled");
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.of(order));
        when(orderCancellationService.cancelByAdmin(order)).thenReturn(cancelled);

        ApiSuccessResponse<OrderResponse> response = controller.updateOrderStatus(
            "o1", new UpdateOrderStatusRequest("cancelled"), "uid", "e@m.com");

        assertThat(response.data().status()).isEqualTo("cancelled");
    }

    // ---- cancelMyOrder ----

    @Test
    void cancelMyOrderCancelsOwnOrder() {
        CheckoutOrder order = order("o1", "paid");
        CheckoutOrder cancelled = order("o1", "cancelled");
        when(orderRepository.findByIdAndUserId("o1", "uid"))
            .thenReturn(java.util.Optional.of(order));
        when(orderCancellationService.cancelByCustomer(order)).thenReturn(cancelled);

        ApiSuccessResponse<OrderResponse> response = controller.cancelMyOrder("o1", "uid");

        assertThat(response.data().status()).isEqualTo("cancelled");
    }

    @Test
    void cancelMyOrderThrowsWhenNotFound() {
        when(orderRepository.findByIdAndUserId("o1", "uid"))
            .thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> controller.cancelMyOrder("o1", "uid"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.NOT_FOUND);
    }

    @Test
    void cancelMyOrderThrowsConflictOnIllegalArgument() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findByIdAndUserId("o1", "uid"))
            .thenReturn(java.util.Optional.of(order));
        when(orderCancellationService.cancelByCustomer(order))
            .thenThrow(new IllegalArgumentException("cannot cancel"));

        assertThatThrownBy(() -> controller.cancelMyOrder("o1", "uid"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.CONFLICT);
    }

    @Test
    void cancelMyOrderThrowsBadGatewayOnIllegalState() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findByIdAndUserId("o1", "uid"))
            .thenReturn(java.util.Optional.of(order));
        when(orderCancellationService.cancelByCustomer(order))
            .thenThrow(new IllegalStateException("gateway error"));

        assertThatThrownBy(() -> controller.cancelMyOrder("o1", "uid"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.BAD_GATEWAY);
    }

    @Test
    void cancelMyOrderThrowsBadGatewayOnPaymentValidationError() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findByIdAndUserId("o1", "uid"))
            .thenReturn(java.util.Optional.of(order));
        when(orderCancellationService.cancelByCustomer(order))
            .thenThrow(new PaymentValidationException("payment error"));

        assertThatThrownBy(() -> controller.cancelMyOrder("o1", "uid"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.BAD_GATEWAY);
    }

    // ---- createShippingLabel ----

    @Test
    void createShippingLabelGeneratesLabel() {
        CheckoutOrder order = order("o1", "paid");
        CheckoutOrder withLabel = order("o1", "processing");
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.of(order));
        when(shippingLabelGenerationService.generateForOrder(order)).thenReturn(withLabel);

        ApiSuccessResponse<OrderResponse> response = controller.createShippingLabel("o1", "uid", "e@m.com");

        assertThat(response.data().status()).isEqualTo("processing");
    }

    @Test
    void createShippingLabelThrowsOnWrongStatus() {
        CheckoutOrder order = order("o1", "pending");
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.of(order));

        assertThatThrownBy(() -> controller.createShippingLabel("o1", "uid", "e@m.com"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.CONFLICT);
    }

    @Test
    void createShippingLabelThrowsOnServiceError() {
        CheckoutOrder order = order("o1", "paid");
        when(orderRepository.findById("o1")).thenReturn(java.util.Optional.of(order));
        when(shippingLabelGenerationService.generateForOrder(order))
            .thenThrow(new IllegalStateException("provider error"));

        assertThatThrownBy(() -> controller.createShippingLabel("o1", "uid", "e@m.com"))
            .isInstanceOf(ResponseStatusException.class)
            .hasFieldOrPropertyWithValue("statusCode", HttpStatus.BAD_GATEWAY);
    }

    // ---- generatePendingShippingLabels ----

    @Test
    void generatePendingShippingLabelsReturnsResult() {
        BulkShippingLabelGenerationResult result = new BulkShippingLabelGenerationResult(
            5, 3, List.of(new BulkShippingLabelGenerationFailure("o1", "failed")));
        when(shippingLabelGenerationService.generatePending(null)).thenReturn(result);

        ApiSuccessResponse<BulkShippingLabelResponse> response =
            controller.generatePendingShippingLabels("uid", "e@m.com");

        assertThat(response.data().candidates()).isEqualTo(5);
        assertThat(response.data().generated()).isEqualTo(3);
        assertThat(response.data().failures()).hasSize(1);
    }

    // ---- helpers ----

    private CheckoutOrder order(String id, String status) {
        return new CheckoutOrder(id, "session-1", "cust-1", "user-1",
            "test@test.com", "CPF", "12345678909", "Recipient",
            status, BigDecimal.valueOf(100), BigDecimal.ZERO,
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP");
    }
}
