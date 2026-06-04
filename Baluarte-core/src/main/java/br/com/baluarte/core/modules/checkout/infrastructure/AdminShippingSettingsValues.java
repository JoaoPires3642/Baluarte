package br.com.baluarte.core.modules.checkout.infrastructure;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public record AdminShippingSettingsValues(
    String provider,
    String originCep,
    BigDecimal packageWeightKg,
    Integer packageHeightCm,
    Integer packageWidthCm,
    Integer packageLengthCm,
    String superfreteBaseUrl,
    String superfreteToken,
    String superfreteServices,
    String superfreteUserAgent,
    String superfreteCartPath,
    String superfreteCheckoutPath,
    String superfreteLabelLinkPath,
    String senderName,
    String senderPhone,
    String senderEmail,
    String senderDocument,
    String senderStreet,
    String senderNumber,
    String senderComplement,
    String senderDistrict,
    String senderCity,
    String senderState,
    List<AdminShippingPackageOption> packageOptions,
    Boolean automaticLabelEnabled,
    String automaticLabelRunTime,
    String automaticLabelCutoffTime
) {
    public List<AdminShippingPackageOption> safePackageOptions() {
        if (packageOptions == null || packageOptions.isEmpty()) {
            return List.of(new AdminShippingPackageOption("Padrao", 999, packageHeightCm, packageWidthCm, packageLengthCm));
        }
        return packageOptions.stream()
            .filter(option -> option != null && option.maxQuantity() != null && option.maxQuantity() > 0)
            .sorted(Comparator.comparing(AdminShippingPackageOption::maxQuantity))
            .toList();
    }

    public AdminShippingPackageOption packageForQuantity(int quantity) {
        int safeQuantity = Math.max(quantity, 1);
        List<AdminShippingPackageOption> options = safePackageOptions();
        return options.stream()
            .filter(option -> option.maxQuantity() >= safeQuantity)
            .findFirst()
            .orElse(options.getLast());
    }

    public BigDecimal totalWeightKg(int quantity) {
        return packageWeightKg.multiply(BigDecimal.valueOf(Math.max(quantity, 1)));
    }
}
