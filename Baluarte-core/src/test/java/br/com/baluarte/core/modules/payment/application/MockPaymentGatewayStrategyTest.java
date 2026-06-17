package br.com.baluarte.core.modules.payment.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MockPaymentGatewayStrategyTest {

    private final MockPaymentGatewayStrategy strategy = new MockPaymentGatewayStrategy();

    @Test
    void providerKeyReturnsMock() {
        assertThat(strategy.providerKey()).isEqualTo("mock");
    }

    @Test
    void createWithPixReturnsPendingPix() {
        var command = new CreatePaymentCommand("session-1", "idem-pix-1", "pix",
            "test@test.com", "CPF", "12345678909", "user-1", "John",
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP",
            BigDecimal.TEN, BigDecimal.valueOf(100), null, null, null, null);

        PaymentGatewayResult result = strategy.create(command);

        assertThat(result.status()).isEqualTo("pending");
        assertThat(result.pixQrCode()).isNotBlank();
        assertThat(result.pixQrCodeBase64()).isNotBlank();
        assertThat(result.providerPaymentId()).startsWith("mock-");
    }

    @Test
    void createWithRejectTokenReturnsRejectedCard() {
        var command = new CreatePaymentCommand("session-1", "idem-reject-1", "credit_card",
            "test@test.com", "CPF", "12345678909", "user-1", "John",
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP",
            BigDecimal.TEN, BigDecimal.valueOf(100), "token-reject", "visa", null, 1);

        PaymentGatewayResult result = strategy.create(command);

        assertThat(result.status()).isEqualTo("rejected");
        assertThat(result.statusDetail()).isEqualTo("cc_rejected_bad_filled_card_number");
    }

    @Test
    void createWithValidTokenReturnsApprovedCard() {
        var command = new CreatePaymentCommand("session-1", "idem-ok-1", "credit_card",
            "test@test.com", "CPF", "12345678909", "user-1", "John",
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP",
            BigDecimal.TEN, BigDecimal.valueOf(100), "token-valid", "visa", null, 3);

        PaymentGatewayResult result = strategy.create(command);

        assertThat(result.status()).isEqualTo("approved");
        assertThat(result.statusDetail()).isEqualTo("accredited");
        assertThat(result.installments()).isEqualTo(3);
    }

    @Test
    void refundReturnsRefunded() {
        PaymentRefundResult result = strategy.refund("mp-pay-123", "mp-order-123", "idem-1");

        assertThat(result.status()).isEqualTo("refunded");
        assertThat(result.statusDetail()).isEqualTo("mock_refunded");
    }
}
