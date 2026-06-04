package br.com.baluarte.core.modules.payment.application;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentGateway {

    private final String activeProvider;
    private final Map<String, PaymentGatewayStrategy> strategyByProvider;

    public PaymentGateway(
        @Value("${app.payment.active-provider:mock}") String activeProvider,
        List<PaymentGatewayStrategy> strategies
    ) {
        this.activeProvider = normalize(activeProvider);
        this.strategyByProvider = strategies.stream()
            .collect(Collectors.toMap(strategy -> normalize(strategy.providerKey()), Function.identity()));
    }

    public String activeProvider() {
        return activeProvider;
    }

    public PaymentGatewayResult create(CreatePaymentCommand command) {
        PaymentGatewayStrategy strategy = strategy(activeProvider);
        return strategy.create(command);
    }

    public PaymentRefundResult refund(String provider, String providerPaymentId, String providerOrderId, String idempotencyKey) {
        PaymentGatewayStrategy strategy = strategy(provider);
        return strategy.refund(providerPaymentId, providerOrderId, idempotencyKey);
    }

    private PaymentGatewayStrategy strategy(String provider) {
        String normalizedProvider = normalize(provider);
        PaymentGatewayStrategy strategy = strategyByProvider.get(normalizedProvider);
        if (strategy == null) {
            throw new IllegalStateException("No payment strategy configured for provider: " + normalizedProvider);
        }
        return strategy;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
