package br.com.baluarte.core.modules.checkout.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.baluarte.core.modules.order.application.ShippingLabelGenerationService;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "RUN_SUPERFRETE_E2E", matches = "true")
class SuperFreteShippingLabelSandboxE2ETest {

    private static final String SANDBOX_HOST = "sandbox.superfrete.com";

    @DynamicPropertySource
    static void superfreteProperties(DynamicPropertyRegistry registry) {
        registry.add("app.shipping.active-provider", () -> "superfrete");
        registry.add("app.shipping.superfrete.base-url",
            () -> envOr("APP_SHIPPING_SUPERFRETE_BASE_URL", "https://sandbox.superfrete.com"));
        registry.add("app.shipping.superfrete.token",
            () -> envOr("APP_SHIPPING_SUPERFRETE_TOKEN", ""));
    }

    private static String envOr(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    @Autowired
    private CheckoutOrderRepository orderRepository;

    @Autowired
    private ShippingLabelGenerationService shippingLabelGenerationService;

    @Value("${app.shipping.superfrete.base-url}")
    private String superfreteBaseUrl;

    @Test
    void generatesSandboxLabelAndStoresTrackingCode() {
        CheckoutOrder order = testOrder();
        orderRepository.save(order);

        CheckoutOrder generatedOrder = shippingLabelGenerationService.generateForOrder(order);

        assertThat(generatedOrder.getShippingLabelId()).isNotBlank();
        assertThat(generatedOrder.getShippingLabelUrl()).isNotBlank();
        if (!isSandbox()) {
            assertThat(generatedOrder.getTrackingCode())
                .as("tracking code obrigatorio em producao")
                .isNotBlank();
        }
        assertThat(orderRepository.findById(generatedOrder.getOrderId()))
            .get()
            .extracting(CheckoutOrder::getTrackingCode)
            .isEqualTo(generatedOrder.getTrackingCode());
    }

    private boolean isSandbox() {
        return superfreteBaseUrl != null && superfreteBaseUrl.contains(SANDBOX_HOST);
    }

    private CheckoutOrder testOrder() {
        String orderId = UUID.randomUUID().toString();
        CheckoutOrder order = new CheckoutOrder(
            orderId,
            "e2e-" + UUID.randomUUID(),
            "e2e-superfrete@baluarte.test",
            "e2e-superfrete-user",
            "e2e-superfrete@baluarte.test",
            "CPF",
            "52998224725",
            "Cliente E2E SuperFrete",
            "paid",
            new BigDecimal("119.90"),
            new BigDecimal("19.90"),
            "01001000",
            "Praca da Se",
            "100",
            "",
            "Se",
            "Sao Paulo",
            "SP"
        );
        order.setShippingServiceId("1");
        order.setShippingServiceName("PAC Sandbox");
        order.setItems(List.of(new CheckoutOrderItem(
            UUID.randomUUID().toString(),
            orderId,
            UUID.randomUUID().toString(),
            "Camisa E2E SuperFrete",
            "M",
            1,
            new BigDecimal("100.00")
        )));
        return order;
    }
}
