package br.com.baluarte.core.modules.checkout.application;

import java.util.List;

public interface ShippingQuoteStrategy {

    String providerKey();

    List<ShippingQuoteOption> quote(ShippingQuoteCommand command);
}
