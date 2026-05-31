package br.com.baluarte.core.modules.payment.domain;

import java.math.BigDecimal;

public class CheckoutOrderItem {

    private String orderItemId;
    private String orderId;
    private String productId;
    private String productName;
    private String size;
    private int quantity;
    private BigDecimal unitPrice;
    private int customNamesCount;
    private int customNumberDigits;

    public CheckoutOrderItem() {}

    public CheckoutOrderItem(
        String orderItemId,
        String orderId,
        String productId,
        String productName,
        String size,
        int quantity,
        BigDecimal unitPrice
    ) {
        this.orderItemId = orderItemId;
        this.orderId = orderId;
        this.productId = productId;
        this.productName = productName;
        this.size = size;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public String getOrderItemId() { return orderItemId; }
    public void setOrderItemId(String orderItemId) { this.orderItemId = orderItemId; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public int getCustomNamesCount() { return customNamesCount; }
    public void setCustomNamesCount(int customNamesCount) { this.customNamesCount = customNamesCount; }
    public int getCustomNumberDigits() { return customNumberDigits; }
    public void setCustomNumberDigits(int customNumberDigits) { this.customNumberDigits = customNumberDigits; }
}
