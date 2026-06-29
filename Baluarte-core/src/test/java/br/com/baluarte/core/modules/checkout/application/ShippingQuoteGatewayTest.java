package br.com.baluarte.core.modules.checkout.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ShippingQuoteGatewayTest {

    @Mock
    private ShippingQuoteStrategy mockStrategy;

    @Mock
    private ShippingQuoteStrategy otherStrategy;

    private ShippingQuoteGateway gateway;

    @BeforeEach
    void setUp() {
        when(mockStrategy.providerKey()).thenReturn("mock");
        when(otherStrategy.providerKey()).thenReturn("other");
        gateway = new ShippingQuoteGateway("mock", List.of(mockStrategy, otherStrategy));
    }

    @Test
    void returnsActiveProvider() {
        assertThat(gateway.activeProvider()).isEqualTo("mock");
    }

    @Test
    void normalizesActiveProviderOnConstruction() {
        ShippingQuoteGateway gw = new ShippingQuoteGateway("  MOCK ", List.of(mockStrategy));
        assertThat(gw.activeProvider()).isEqualTo("mock");
    }

    @Test
    void quotesUsingActiveStrategy() {
        ShippingQuoteCommand command = new ShippingQuoteCommand("01001000", "SP", 1, false);
        List<ShippingQuoteOption> expected = List.of(
            new ShippingQuoteOption("standard", "Padrao", new BigDecimal("10.00"), 3)
        );
        when(mockStrategy.quote(command)).thenReturn(expected);

        List<ShippingQuoteOption> result = gateway.quote(command);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void throwsWhenNoStrategyMatchesActiveProvider() {
        ShippingQuoteGateway gw = new ShippingQuoteGateway("unknown", List.of(mockStrategy));

        assertThatThrownBy(() -> gw.quote(new ShippingQuoteCommand("01001000", "SP", 1, false)))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("No shipping strategy configured for provider: unknown");
    }

    @Test
    void throwsWhenActiveProviderIsNull() {
        ShippingQuoteGateway gw = new ShippingQuoteGateway(null, List.of(mockStrategy));

        assertThatThrownBy(() -> gw.quote(new ShippingQuoteCommand("01001000", "SP", 1, false)))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("No shipping strategy configured for provider: ");
    }
}
