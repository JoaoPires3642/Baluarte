package br.com.baluarte.core.modules.payment.infrastructure;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.Parameter;

@Entity
@Table(name = "checkout_order")
@Getter
@NoArgsConstructor
public class CheckoutOrderJpaEntity {

    @Id
    @Column(name = "order_id", nullable = false, length = 36)
    private String orderId;

    @Column(name = "order_number", nullable = false, unique = true)
    private Long orderNumber;

    @Column(name = "checkout_session_id", nullable = false, length = 64)
    private String checkoutSessionId;

    @Column(name = "customer_ref", length = 120)
    private String customerRef;

    @Column(name = "clerk_user_id", length = 120)
    private String clerkUserId;

    @Column(name = "payer_email", length = 160)
    private String payerEmail;

    @Column(name = "payer_document_type", length = 10)
    private String payerDocumentType;

    @Column(name = "payer_document_number", length = 20)
    private String payerDocumentNumber;

    @Column(name = "recipient_name", length = 120)
    private String recipientName;

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

    @Column(name = "shipping_complement", length = 120)
    private String shippingComplement;

    @Column(name = "shipping_neighborhood", nullable = false, length = 120)
    private String shippingNeighborhood;

    @Column(name = "shipping_city", nullable = false, length = 120)
    private String shippingCity;

    @Column(name = "shipping_state", nullable = false, length = 2)
    private String shippingState;

    @Column(name = "shipping_service_id", length = 40)
    private String shippingServiceId;

    @Column(name = "shipping_service_name", length = 80)
    private String shippingServiceName;

    @Column(name = "shipping_provider", length = 40)
    private String shippingProvider;

    @Column(name = "shipping_label_id", length = 120)
    private String shippingLabelId;

    @Column(name = "shipping_label_url", length = 500)
    private String shippingLabelUrl;

    @Column(name = "payment_reference", length = 80)
    private String paymentReference;

    @Column(name = "tracking_code", length = 80)
    private String trackingCode;

    @Column(name = "tracking_url", length = 500)
    private String trackingUrl;

    @Column(name = "shipping_type", nullable = false, length = 20)
    private String shippingType;

    @Column(name = "delivery_station", length = 120)
    private String deliveryStation;

    @Column(name = "delivery_day", length = 20)
    private String deliveryDay;

    @Column(name = "delivery_time_slot", length = 20)
    private String deliveryTimeSlot;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "orderId", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CheckoutOrderItemJpaEntity> items = new ArrayList<>();

    public static CheckoutOrderJpaEntity create(CheckoutOrder order) {
        CheckoutOrderJpaEntity entity = new CheckoutOrderJpaEntity();
        entity.apply(order);
        entity.createdAt = LocalDateTime.now();
        entity.updatedAt = entity.createdAt;
        return entity;
    }

    public void apply(CheckoutOrder order) {
        this.orderId = order.getOrderId();
        if (order.getOrderNumber() != null) {
            this.orderNumber = order.getOrderNumber();
        }
        this.checkoutSessionId = order.getCheckoutSessionId();
        this.customerRef = order.getCustomerRef();
        this.clerkUserId = order.getClerkUserId();
        this.payerEmail = order.getPayerEmail();
        this.payerDocumentType = order.getPayerDocumentType();
        this.payerDocumentNumber = order.getPayerDocumentNumber();
        this.recipientName = order.getRecipientName();
        this.status = order.getStatus();
        this.totalAmount = order.getTotalAmount();
        this.shippingPrice = order.getShippingPrice();
        this.shippingCep = order.getShippingCep();
        this.shippingStreet = order.getShippingStreet();
        this.shippingNumber = order.getShippingNumber();
        this.shippingComplement = order.getShippingComplement();
        this.shippingNeighborhood = order.getShippingNeighborhood();
        this.shippingCity = order.getShippingCity();
        this.shippingState = order.getShippingState().toUpperCase();
        this.shippingServiceId = order.getShippingServiceId();
        this.shippingServiceName = order.getShippingServiceName();
        this.shippingProvider = order.getShippingProvider();
        this.shippingLabelId = order.getShippingLabelId();
        this.shippingLabelUrl = order.getShippingLabelUrl();
        this.paymentReference = order.getPaymentReference();
        this.trackingCode = order.getTrackingCode();
        this.trackingUrl = order.getTrackingUrl();
        this.shippingType = order.getShippingType() != null ? order.getShippingType() : "delivery";
        this.deliveryStation = order.getDeliveryStation();
        this.deliveryDay = order.getDeliveryDay();
        this.deliveryTimeSlot = order.getDeliveryTimeSlot();
        this.updatedAt = LocalDateTime.now();
    }

    public CheckoutOrder toDomain() {
        CheckoutOrder order = new CheckoutOrder(orderId, checkoutSessionId, customerRef, clerkUserId,
                payerEmail, payerDocumentType, payerDocumentNumber, recipientName, status, totalAmount,
                shippingPrice, shippingCep, shippingStreet, shippingNumber, shippingComplement, shippingNeighborhood,
                shippingCity, shippingState);
        order.setOrderNumber(orderNumber);
        order.setPaymentReference(paymentReference);
        order.setTrackingCode(trackingCode);
        order.setTrackingUrl(trackingUrl);
        order.setShippingServiceId(shippingServiceId);
        order.setShippingServiceName(shippingServiceName);
        order.setShippingProvider(shippingProvider);
        order.setShippingLabelId(shippingLabelId);
        order.setShippingLabelUrl(shippingLabelUrl);
        order.setShippingType(shippingType);
        order.setDeliveryStation(deliveryStation);
        order.setDeliveryDay(deliveryDay);
        order.setDeliveryTimeSlot(deliveryTimeSlot);
        order.setItems(items.stream().map(CheckoutOrderItemJpaEntity::toDomain).toList());
        order.setCreatedAt(createdAt.toInstant(java.time.ZoneOffset.UTC));
        order.setUpdatedAt(updatedAt.toInstant(java.time.ZoneOffset.UTC));
        return order;
    }

    public void setOrderNumber(Long orderNumber) {
        this.orderNumber = orderNumber;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
        this.updatedAt = LocalDateTime.now();
    }
}
