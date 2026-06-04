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
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "RUN_SUPERFRETE_E2E", matches = "true")
class SuperFreteShippingLabelSandboxE2ETest {

    @Autowired
    private CheckoutOrderRepository orderRepository;

    @Autowired
    private ShippingLabelGenerationService shippingLabelGenerationService;

    @Test
    void generatesSandboxLabelAndStoresTrackingCode() {
        CheckoutOrder order = testOrder();
        orderRepository.save(order);

        CheckoutOrder generatedOrder = shippingLabelGenerationService.generateForOrder(order);

        assertThat(generatedOrder.getShippingLabelId()).isNotBlank();
        assertThat(generatedOrder.getShippingLabelUrl()).isNotBlank();
        assertThat(generatedOrder.getTrackingCode()).isNotBlank();
        assertThat(orderRepository.findById(generatedOrder.getOrderId()))
            .get()
            .extracting(CheckoutOrder::getTrackingCode)
            .isEqualTo(generatedOrder.getTrackingCode());
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
