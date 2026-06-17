package br.com.baluarte.core.modules.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentGatewayTest {

    @Mock
    private PaymentGatewayStrategy mockStrategy;

    @Test
    void activeProviderReturnsConfiguredProvider() {
        when(mockStrategy.providerKey()).thenReturn("mock");
        var gateway = new PaymentGateway("mock", List.of(mockStrategy));
        assertThat(gateway.activeProvider()).isEqualTo("mock");
    }

    @Test
    void createDelegatesToActiveStrategy() {
        when(mockStrategy.providerKey()).thenReturn("mock");
        var gateway = new PaymentGateway("mock", List.of(mockStrategy));
        var command = createCommand();
        var result = PaymentGatewayResult.pendingPix("pp-1", "po-1", "pending", "waiting", "qr", null, null);
        when(mockStrategy.create(command)).thenReturn(result);

        PaymentGatewayResult actual = gateway.create(command);

        assertThat(actual.providerPaymentId()).isEqualTo("pp-1");
    }

    @Test
    void createThrowsWhenNoStrategyForProvider() {
        when(mockStrategy.providerKey()).thenReturn("mock");
        var gateway = new PaymentGateway("unknown", List.of(mockStrategy));
        assertThatThrownBy(() -> gateway.create(createCommand()))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("unknown");
    }

    @Test
    void refundDelegatesToStrategy() {
        when(mockStrategy.providerKey()).thenReturn("mock");
        var gateway = new PaymentGateway("mock", List.of(mockStrategy));
        var refundResult = new PaymentRefundResult("refunded", "refunded");
        when(mockStrategy.refund("pp-1", "po-1", "idem-1")).thenReturn(refundResult);

        PaymentRefundResult actual = gateway.refund("mock", "pp-1", "po-1", "idem-1");

        assertThat(actual.status()).isEqualTo("refunded");
    }

    @Test
    void refundThrowsWhenNoStrategy() {
        when(mockStrategy.providerKey()).thenReturn("mock");
        var gateway = new PaymentGateway("mock", List.of(mockStrategy));
        assertThatThrownBy(() -> gateway.refund("nonexistent", "p1", null, "idem"))
            .isInstanceOf(IllegalStateException.class);
    }

    private CreatePaymentCommand createCommand() {
        return new CreatePaymentCommand(
            "session-1", "idem-1", "pix",
            "payer@test.com", null, null, null, null,
            null, null, null, null, null, null, null,
            BigDecimal.ZERO, BigDecimal.TEN,
            null, null, null, null
        );
    }
}
