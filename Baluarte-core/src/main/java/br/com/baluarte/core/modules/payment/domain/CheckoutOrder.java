package br.com.baluarte.core.modules.payment.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class CheckoutOrder {

    private String orderId;
    private String checkoutSessionId;
    private String customerRef;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal shippingPrice;
    private String shippingCep;
    private String shippingStreet;
    private String shippingNumber;
    private String shippingNeighborhood;
    private String shippingCity;
    private String shippingState;
    private String paymentReference;
    private Instant createdAt;
    private Instant updatedAt;
    private List<CheckoutOrderItem> items;

    public CheckoutOrder() {}

    public CheckoutOrder(
        String orderId,
        String checkoutSessionId,
        String customerRef,
        String status,
        BigDecimal totalAmount,
        BigDecimal shippingPrice,
        String shippingCep,
        String shippingStreet,
        String shippingNumber,
        String shippingNeighborhood,
        String shippingCity,
        String shippingState
    ) {
        this.orderId = orderId;
        this.checkoutSessionId = checkoutSessionId;
        this.customerRef = customerRef;
        this.status = status;
        this.totalAmount = totalAmount;
        this.shippingPrice = shippingPrice;
        this.shippingCep = shippingCep;
        this.shippingStreet = shippingStreet;
        this.shippingNumber = shippingNumber;
        this.shippingNeighborhood = shippingNeighborhood;
        this.shippingCity = shippingCity;
        this.shippingState = shippingState;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getCheckoutSessionId() { return checkoutSessionId; }
    public void setCheckoutSessionId(String checkoutSessionId) { this.checkoutSessionId = checkoutSessionId; }
    public String getCustomerRef() { return customerRef; }
    public void setCustomerRef(String customerRef) { this.customerRef = customerRef; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public BigDecimal getShippingPrice() { return shippingPrice; }
    public void setShippingPrice(BigDecimal shippingPrice) { this.shippingPrice = shippingPrice; }
    public String getShippingCep() { return shippingCep; }
    public void setShippingCep(String shippingCep) { this.shippingCep = shippingCep; }
    public String getShippingStreet() { return shippingStreet; }
    public void setShippingStreet(String shippingStreet) { this.shippingStreet = shippingStreet; }
    public String getShippingNumber() { return shippingNumber; }
    public void setShippingNumber(String shippingNumber) { this.shippingNumber = shippingNumber; }
    public String getShippingNeighborhood() { return shippingNeighborhood; }
    public void setShippingNeighborhood(String shippingNeighborhood) { this.shippingNeighborhood = shippingNeighborhood; }
    public String getShippingCity() { return shippingCity; }
    public void setShippingCity(String shippingCity) { this.shippingCity = shippingCity; }
    public String getShippingState() { return shippingState; }
    public void setShippingState(String shippingState) { this.shippingState = shippingState; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public List<CheckoutOrderItem> getItems() { return items; }
    public void setItems(List<CheckoutOrderItem> items) { this.items = items; }
}