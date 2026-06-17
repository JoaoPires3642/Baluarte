package br.com.baluarte.core.modules.payment.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class CheckoutOrderItemTest {

    @Test
    void constructorAndGetters() {
        var item = new CheckoutOrderItem("item-1", "order-1", "prod-1", "Camisa", "M", 2, BigDecimal.valueOf(99.90));
        assertThat(item.getOrderItemId()).isEqualTo("item-1");
        assertThat(item.getOrderId()).isEqualTo("order-1");
        assertThat(item.getProductId()).isEqualTo("prod-1");
        assertThat(item.getProductName()).isEqualTo("Camisa");
        assertThat(item.getSize()).isEqualTo("M");
        assertThat(item.getQuantity()).isEqualTo(2);
        assertThat(item.getUnitPrice()).isEqualByComparingTo("99.9");
    }

    @Test
    void noArgsConstructorAndSetters() {
        var item = new CheckoutOrderItem();
        item.setCustomNamesCount(3);
        item.setCustomNumberDigits(7);
        assertThat(item.getCustomNamesCount()).isEqualTo(3);
        assertThat(item.getCustomNumberDigits()).isEqualTo(7);
    }

    @Test
    void defaultValues() {
        var item = new CheckoutOrderItem();
        assertThat(item.getCustomNamesCount()).isZero();
        assertThat(item.getCustomNumberDigits()).isZero();
    }
}
