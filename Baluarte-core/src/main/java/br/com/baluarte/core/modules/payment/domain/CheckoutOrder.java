package br.com.baluarte.core.modules.payment.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class CheckoutOrder {

    private String orderId;
    private Long orderNumber;
    private String checkoutSessionId;
    private String customerRef;
    private String clerkUserId;
    private String payerEmail;
    private String payerDocumentType;
    private String payerDocumentNumber;
    private String recipientName;
    private String status;
    private BigDecimal totalAmount;
    private BigDecimal shippingPrice;
    private String shippingCep;
    private String shippingStreet;
    private String shippingNumber;
    private String shippingComplement;
    private String shippingNeighborhood;
    private String shippingCity;
    private String shippingState;
    private String shippingServiceId;
    private String shippingServiceName;
    private String shippingProvider;
    private String shippingLabelId;
    private String shippingLabelUrl;
    private String paymentReference;
    private String trackingCode;
    private String trackingUrl;
    private String shippingType;
    private String deliveryStation;
    private String deliveryDay;
    private String deliveryDate;
    private String deliveryTimeSlot;
    private Instant createdAt;
    private Instant updatedAt;
    private List<CheckoutOrderItem> items;

    public CheckoutOrder() {}

    public CheckoutOrder(
        String orderId,
        String checkoutSessionId,
        String customerRef,
        String clerkUserId,
        String payerEmail,
        String payerDocumentType,
        String payerDocumentNumber,
        String recipientName,
        String status,
        BigDecimal totalAmount,
        BigDecimal shippingPrice,
        String shippingCep,
        String shippingStreet,
        String shippingNumber,
        String shippingComplement,
        String shippingNeighborhood,
        String shippingCity,
        String shippingState
    ) {
        this.orderId = orderId;
        this.checkoutSessionId = checkoutSessionId;
        this.customerRef = customerRef;
        this.clerkUserId = clerkUserId;
        this.payerEmail = payerEmail;
        this.payerDocumentType = payerDocumentType;
        this.payerDocumentNumber = payerDocumentNumber;
        this.recipientName = recipientName;
        this.status = status;
        this.totalAmount = totalAmount;
        this.shippingPrice = shippingPrice;
        this.shippingCep = shippingCep;
        this.shippingStreet = shippingStreet;
        this.shippingNumber = shippingNumber;
        this.shippingComplement = shippingComplement;
        this.shippingNeighborhood = shippingNeighborhood;
        this.shippingCity = shippingCity;
        this.shippingState = shippingState;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public Long getOrderNumber() { return orderNumber; }
    public void setOrderNumber(Long orderNumber) { this.orderNumber = orderNumber; }
    public String getCheckoutSessionId() { return checkoutSessionId; }
    public void setCheckoutSessionId(String checkoutSessionId) { this.checkoutSessionId = checkoutSessionId; }
    public String getCustomerRef() { return customerRef; }
    public void setCustomerRef(String customerRef) { this.customerRef = customerRef; }
    public String getClerkUserId() { return clerkUserId; }
    public void setClerkUserId(String clerkUserId) { this.clerkUserId = clerkUserId; }
    public String getPayerEmail() { return payerEmail; }
    public void setPayerEmail(String payerEmail) { this.payerEmail = payerEmail; }
    public String getPayerDocumentType() { return payerDocumentType; }
    public void setPayerDocumentType(String payerDocumentType) { this.payerDocumentType = payerDocumentType; }
    public String getPayerDocumentNumber() { return payerDocumentNumber; }
    public void setPayerDocumentNumber(String payerDocumentNumber) { this.payerDocumentNumber = payerDocumentNumber; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
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
    public String getShippingComplement() { return shippingComplement; }
    public void setShippingComplement(String shippingComplement) { this.shippingComplement = shippingComplement; }
    public String getShippingNeighborhood() { return shippingNeighborhood; }
    public void setShippingNeighborhood(String shippingNeighborhood) { this.shippingNeighborhood = shippingNeighborhood; }
    public String getShippingCity() { return shippingCity; }
    public void setShippingCity(String shippingCity) { this.shippingCity = shippingCity; }
    public String getShippingState() { return shippingState; }
    public void setShippingState(String shippingState) { this.shippingState = shippingState; }
    public String getShippingServiceId() { return shippingServiceId; }
    public void setShippingServiceId(String shippingServiceId) { this.shippingServiceId = shippingServiceId; }
    public String getShippingServiceName() { return shippingServiceName; }
    public void setShippingServiceName(String shippingServiceName) { this.shippingServiceName = shippingServiceName; }
    public String getShippingProvider() { return shippingProvider; }
    public void setShippingProvider(String shippingProvider) { this.shippingProvider = shippingProvider; }
    public String getShippingLabelId() { return shippingLabelId; }
    public void setShippingLabelId(String shippingLabelId) { this.shippingLabelId = shippingLabelId; }
    public String getShippingLabelUrl() { return shippingLabelUrl; }
    public void setShippingLabelUrl(String shippingLabelUrl) { this.shippingLabelUrl = shippingLabelUrl; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public String getTrackingCode() { return trackingCode; }
    public void setTrackingCode(String trackingCode) { this.trackingCode = trackingCode; }
    public String getTrackingUrl() { return trackingUrl; }
    public void setTrackingUrl(String trackingUrl) { this.trackingUrl = trackingUrl; }
    public String getShippingType() { return shippingType; }
    public void setShippingType(String shippingType) { this.shippingType = shippingType; }
    public String getDeliveryStation() { return deliveryStation; }
    public void setDeliveryStation(String deliveryStation) { this.deliveryStation = deliveryStation; }
    public String getDeliveryDay() { return deliveryDay; }
    public void setDeliveryDay(String deliveryDay) { this.deliveryDay = deliveryDay; }
    public String getDeliveryDate() { return deliveryDate; }
    public void setDeliveryDate(String deliveryDate) { this.deliveryDate = deliveryDate; }
    public String getDeliveryTimeSlot() { return deliveryTimeSlot; }
    public void setDeliveryTimeSlot(String deliveryTimeSlot) { this.deliveryTimeSlot = deliveryTimeSlot; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public List<CheckoutOrderItem> getItems() { return items; }
    public void setItems(List<CheckoutOrderItem> items) { this.items = items; }
}
