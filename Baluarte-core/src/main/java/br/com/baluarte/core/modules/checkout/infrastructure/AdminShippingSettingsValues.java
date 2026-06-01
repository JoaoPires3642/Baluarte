package br.com.baluarte.core.modules.checkout.infrastructure;

import java.math.BigDecimal;

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
    String senderState
) {}
