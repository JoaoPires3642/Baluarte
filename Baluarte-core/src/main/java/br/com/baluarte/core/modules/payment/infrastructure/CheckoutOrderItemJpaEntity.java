package br.com.baluarte.core.modules.payment.infrastructure;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "checkout_order_item")
@Getter
@NoArgsConstructor
public class CheckoutOrderItemJpaEntity {

    @Id
    @Column(name = "order_item_id", nullable = false, length = 36)
    private String orderItemId;

    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Column(name = "product_id", nullable = false, length = 80)
    private String productId;

    @Column(name = "size", nullable = false, length = 4)
    private String size;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "custom_names_count", nullable = false)
    private int customNamesCount;

    @Column(name = "custom_number_digits", nullable = false)
    private int customNumberDigits;

    public static CheckoutOrderItemJpaEntity create(String orderItemId, String orderId,
            String productId, String size, int quantity, BigDecimal unitPrice) {
        CheckoutOrderItemJpaEntity entity = new CheckoutOrderItemJpaEntity();
        entity.orderItemId = orderItemId;
        entity.orderId = orderId;
        entity.productId = productId;
        entity.size = size;
        entity.quantity = quantity;
        entity.unitPrice = unitPrice;
        return entity;
    }
}