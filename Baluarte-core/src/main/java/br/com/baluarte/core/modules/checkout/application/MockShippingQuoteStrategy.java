package br.com.baluarte.core.modules.checkout.application;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MockShippingQuoteStrategy implements ShippingQuoteStrategy {

    @Override
    public String providerKey() {
        return "mock";
    }

    @Override
    public List<ShippingQuoteOption> quote(ShippingQuoteCommand command) {
        String digits = command.cep() == null ? "" : command.cep().replaceAll("\\D", "");
        int firstDigit = digits.isEmpty() ? 9 : Character.digit(digits.charAt(0), 10);
        int itemSurchargeUnits = Math.max(0, command.itemsCount() - 1);

        BigDecimal regionalBase = switch (firstDigit) {
            case 0, 1, 2 -> new BigDecimal("13.90");
            case 3, 4, 5 -> new BigDecimal("18.90");
            default -> new BigDecimal("24.90");
        };

        BigDecimal itemSurcharge = BigDecimal.valueOf(itemSurchargeUnits)
            .multiply(new BigDecimal("1.50"));
        BigDecimal standard = regionalBase.add(itemSurcharge).setScale(2, RoundingMode.HALF_UP);
        BigDecimal express = standard.add(new BigDecimal("8.00")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal economy = standard.subtract(new BigDecimal("4.00")).max(new BigDecimal("9.90"))
            .setScale(2, RoundingMode.HALF_UP);

        int standardDays = firstDigit <= 2 ? 3 : firstDigit <= 5 ? 5 : 8;
        int expressDays = Math.max(1, standardDays - 2);
        int economyDays = standardDays + 2;

        return List.of(
            new ShippingQuoteOption("economy", "Economico", economy, economyDays),
            new ShippingQuoteOption("standard", "Padrao", standard, standardDays),
            new ShippingQuoteOption("express", "Expresso", express, expressDays)
        );
    }
}
