package br.com.baluarte.core.modules.payment.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record CreatePaymentRequest(
    @NotBlank String checkoutSessionId,
    @NotBlank String idempotencyKey,
    @NotBlank String method,
    @NotNull @Valid Payer payer,
    @NotNull @Valid ShippingAddress shippingAddress,
    @NotNull @Valid ShippingSelection shipping,
    @NotNull @Size(min = 1) List<@Valid Item> items,
    @Valid Card card
) {
    public record Payer(
        @Email @NotBlank String email,
        @NotNull @Valid Identification identification
    ) {}

    public record Identification(@NotBlank String type, @NotBlank String number) {}

    public record ShippingAddress(
        @NotBlank String recipientName,
        @NotBlank @Pattern(regexp = "^[0-9]{5}-?[0-9]{3}$") String cep,
        @NotBlank String street,
        @NotBlank String number,
        String complement,
        @NotBlank String neighborhood,
        @NotBlank String city,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String state
    ) {}

    public record ShippingSelection(@NotBlank String optionId, @NotBlank String label, @NotNull @DecimalMin("0.00") BigDecimal price) {}

    public record Item(
        @NotBlank String productId,
        @NotBlank String size,
        @Min(1) int quantity,
        BigDecimal unitPrice,
        List<@NotBlank String> customNames,
        @Pattern(regexp = "^[0-9]{0,2}$") String customNumber
    ) {}

    public record Card(
        @NotBlank String token,
        @NotBlank String paymentMethodId,
        String issuerId,
        @Min(1) @Max(12) Integer installments
    ) {}
}
