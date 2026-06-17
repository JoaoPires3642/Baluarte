package br.com.baluarte.core.modules.payment.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.payment.application.CreatePaymentUseCase;
import br.com.baluarte.core.modules.payment.application.PaymentGateway;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    @Mock
    private CreatePaymentUseCase createPaymentUseCase;

    @Mock
    private PaymentGateway paymentGateway;

    private PaymentController controller;

    @BeforeEach
    void setUp() {
        controller = new PaymentController(createPaymentUseCase, paymentGateway);
    }

    @Test
    void createsPaymentSuccessfully() {
        var request = new CreatePaymentRequest(
            "session-1", "idem-123", "credit_card",
            new CreatePaymentRequest.Payer("test@test.com",
                new CreatePaymentRequest.Identification("CPF", "12345678909")),
            new CreatePaymentRequest.ShippingAddress("John", "01001000", "Rua A", "100", null, "Centro", "SP", "SP"),
            new CreatePaymentRequest.ShippingSelection("opt-1", "Correios", BigDecimal.TEN),
            List.of(new CreatePaymentRequest.Item("550e8400-e29b-41d4-a716-446655440000", "M", 1, null, null, null)),
            new CreatePaymentRequest.Card("token-123", "visa", null, 1),
            "delivery", null, null, null, null
        );
        var response = new CreatePaymentResponse("pay-1", "order-1", "BAL1001", "mock",
            "credit_card", "approved", "accredited", 1, null);

        when(paymentGateway.activeProvider()).thenReturn("mock");
        when(createPaymentUseCase.execute(request, "mock", "user-1")).thenReturn(response);

        ApiSuccessResponse<CreatePaymentResponse> result = controller.createPayment("user-1", request);

        assertThat(result.data()).isEqualTo(response);
    }

    @Test
    void rejectsNullUserId() {
        var request = new CreatePaymentRequest(
            "session-1", "idem-123", "pix",
            new CreatePaymentRequest.Payer("test@test.com",
                new CreatePaymentRequest.Identification("CPF", "12345678909")),
            new CreatePaymentRequest.ShippingAddress("John", "01001000", "Rua A", "100", null, "Centro", "SP", "SP"),
            new CreatePaymentRequest.ShippingSelection("opt-1", "Correios", BigDecimal.TEN),
            List.of(new CreatePaymentRequest.Item("550e8400-e29b-41d4-a716-446655440000", "M", 1, null, null, null)),
            null, "delivery", null, null, null, null
        );

        assertThatThrownBy(() -> controller.createPayment(null, request))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatusCode.valueOf(401));
                assertThat(ex.getReason()).isEqualTo("Authentication required");
            });
    }

    @Test
    void rejectsBlankUserId() {
        var request = new CreatePaymentRequest(
            "session-1", "idem-123", "pix",
            new CreatePaymentRequest.Payer("test@test.com",
                new CreatePaymentRequest.Identification("CPF", "12345678909")),
            new CreatePaymentRequest.ShippingAddress("John", "01001000", "Rua A", "100", null, "Centro", "SP", "SP"),
            new CreatePaymentRequest.ShippingSelection("opt-1", "Correios", BigDecimal.TEN),
            List.of(new CreatePaymentRequest.Item("550e8400-e29b-41d4-a716-446655440000", "M", 1, null, null, null)),
            null, "delivery", null, null, null, null
        );

        assertThatThrownBy(() -> controller.createPayment("   ", request))
            .isInstanceOf(ResponseStatusException.class)
            .satisfies(e -> {
                var ex = (ResponseStatusException) e;
                assertThat(ex.getStatusCode()).isEqualTo(HttpStatusCode.valueOf(401));
                assertThat(ex.getReason()).isEqualTo("Authentication required");
            });
    }
}
