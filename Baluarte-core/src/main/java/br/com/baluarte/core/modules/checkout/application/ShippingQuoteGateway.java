package br.com.baluarte.core.modules.checkout.application;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ShippingQuoteGateway {

    private final String activeProvider;
    private final Map<String, ShippingQuoteStrategy> strategyByProvider;

    public ShippingQuoteGateway(
        @Value("${app.shipping.active-provider:mock}") String activeProvider,
        List<ShippingQuoteStrategy> strategies
    ) {
        this.activeProvider = normalize(activeProvider);
        this.strategyByProvider = strategies.stream()
            .collect(Collectors.toMap(strategy -> normalize(strategy.providerKey()), Function.identity()));
    }

    public String activeProvider() {
        return activeProvider;
    }

    public List<ShippingQuoteOption> quote(ShippingQuoteCommand command) {
        ShippingQuoteStrategy strategy = strategyByProvider.get(activeProvider);
        if (strategy == null) {
            throw new IllegalStateException("No shipping strategy configured for provider: " + activeProvider);
        }

        return strategy.quote(command);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
