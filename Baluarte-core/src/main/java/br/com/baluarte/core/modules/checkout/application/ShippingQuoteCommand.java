package br.com.baluarte.core.modules.checkout.application;

public record ShippingQuoteCommand(
    String cep,
    String state,
    int itemsCount,
    boolean hasPersonalization
) {
}
