package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "checkout_order")
@Getter
@NoArgsConstructor
public class CheckoutOrderJpaEntity {

    @Id
    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Column(name = "checkout_session_id", nullable = false, length = 64)
    private String checkoutSessionId;

    @Column(name = "customer_ref", length = 120)
    private String customerRef;

    @Column(name = "status", nullable = false, length = 40)
    private String status;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "shipping_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal shippingPrice;

    @Column(name = "shipping_cep", nullable = false, length = 9)
    private String shippingCep;

    @Column(name = "shipping_street", nullable = false, length = 120)
    private String shippingStreet;

    @Column(name = "shipping_number", nullable = false, length = 20)
    private String shippingNumber;

    @Column(name = "shipping_neighborhood", nullable = false, length = 120)
    private String shippingNeighborhood;

    @Column(name = "shipping_city", nullable = false, length = 120)
    private String shippingCity;

    @Column(name = "shipping_state", nullable = false, length = 2)
    private String shippingState;

    @Column(name = "payment_reference", length = 80)
    private String paymentReference;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CheckoutOrderItemJpaEntity> items = new ArrayList<>();

    public static CheckoutOrderJpaEntity create(String orderId, String checkoutSessionId, String customerRef,
            BigDecimal totalAmount, BigDecimal shippingPrice, String cep, String street,
            String number, String neighborhood, String city, String state) {
        CheckoutOrderJpaEntity entity = new CheckoutOrderJpaEntity();
        entity.orderId = orderId;
        entity.checkoutSessionId = checkoutSessionId;
        entity.customerRef = customerRef;
        entity.status = "pending";
        entity.totalAmount = totalAmount;
        entity.shippingPrice = shippingPrice;
        entity.shippingCep = cep;
        entity.shippingStreet = street;
        entity.shippingNumber = number;
        entity.shippingNeighborhood = neighborhood;
        entity.shippingCity = city;
        entity.shippingState = state.toUpperCase();
        entity.createdAt = LocalDateTime.now();
        entity.updatedAt = entity.createdAt;
        return entity;
    }

    public CheckoutOrder toDomain() {
        CheckoutOrder order = new CheckoutOrder(orderId, checkoutSessionId, customerRef, status, totalAmount,
                shippingPrice, shippingCep, shippingStreet, shippingNumber, shippingNeighborhood,
                shippingCity, shippingState);
        order.setPaymentReference(paymentReference);
        order.setCreatedAt(createdAt.toInstant(java.time.ZoneOffset.UTC));
        order.setUpdatedAt(updatedAt.toInstant(java.time.ZoneOffset.UTC));
        return order;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
        this.updatedAt = LocalDateTime.now();
    }
}