package br.com.baluarte.core.modules.checkout.infrastructure;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminShippingSettingsProperties {

    private final String provider;
    private final String originCep;
    private final BigDecimal packageWeightKg;
    private final Integer packageHeightCm;
    private final Integer packageWidthCm;
    private final Integer packageLengthCm;
    private final String superfreteBaseUrl;
    private final String superfreteToken;
    private final String superfreteServices;
    private final String superfreteUserAgent;
    private final String superfreteCartPath;
    private final String superfreteCheckoutPath;
    private final String superfreteLabelLinkPath;
    private final String senderName;
    private final String senderPhone;
    private final String senderEmail;
    private final String senderDocument;
    private final String senderStreet;
    private final String senderNumber;
    private final String senderComplement;
    private final String senderDistrict;
    private final String senderCity;
    private final String senderState;

    public AdminShippingSettingsProperties(
        @Value("${app.shipping.active-provider:superfrete}") String provider,
        @Value("${app.shipping.origin-cep:01153000}") String originCep,
        @Value("${app.shipping.package.product-weight-kg:0.3}") BigDecimal packageWeightKg,
        @Value("${app.shipping.package.product-height-cm:4}") Integer packageHeightCm,
        @Value("${app.shipping.package.product-width-cm:25}") Integer packageWidthCm,
        @Value("${app.shipping.package.product-length-cm:35}") Integer packageLengthCm,
        @Value("${app.shipping.superfrete.base-url:https://sandbox.superfrete.com}") String superfreteBaseUrl,
        @Value("${app.shipping.superfrete.token:}") String superfreteToken,
        @Value("${app.shipping.superfrete.services:1,2,17}") String superfreteServices,
        @Value("${app.shipping.superfrete.user-agent:Baluarte/1.0 (contato@baluarte.com)}") String superfreteUserAgent,
        @Value("${app.shipping.superfrete.cart-path:/api/v0/cart}") String superfreteCartPath,
        @Value("${app.shipping.superfrete.checkout-path:/api/v0/checkout}") String superfreteCheckoutPath,
        @Value("${app.shipping.superfrete.label-link-path:/api/v0/tag/print}") String superfreteLabelLinkPath,
        @Value("${app.shipping.sender.name:}") String senderName,
        @Value("${app.shipping.sender.phone:}") String senderPhone,
        @Value("${app.shipping.sender.email:}") String senderEmail,
        @Value("${app.shipping.sender.document:}") String senderDocument,
        @Value("${app.shipping.sender.street:}") String senderStreet,
        @Value("${app.shipping.sender.number:}") String senderNumber,
        @Value("${app.shipping.sender.complement:}") String senderComplement,
        @Value("${app.shipping.sender.district:}") String senderDistrict,
        @Value("${app.shipping.sender.city:}") String senderCity,
        @Value("${app.shipping.sender.state:}") String senderState
    ) {
        this.provider = provider;
        this.originCep = originCep;
        this.packageWeightKg = packageWeightKg;
        this.packageHeightCm = packageHeightCm;
        this.packageWidthCm = packageWidthCm;
        this.packageLengthCm = packageLengthCm;
        this.superfreteBaseUrl = superfreteBaseUrl;
        this.superfreteToken = superfreteToken;
        this.superfreteServices = superfreteServices;
        this.superfreteUserAgent = superfreteUserAgent;
        this.superfreteCartPath = superfreteCartPath;
        this.superfreteCheckoutPath = superfreteCheckoutPath;
        this.superfreteLabelLinkPath = superfreteLabelLinkPath;
        this.senderName = senderName;
        this.senderPhone = senderPhone;
        this.senderEmail = senderEmail;
        this.senderDocument = senderDocument;
        this.senderStreet = senderStreet;
        this.senderNumber = senderNumber;
        this.senderComplement = senderComplement;
        this.senderDistrict = senderDistrict;
        this.senderCity = senderCity;
        this.senderState = senderState;
    }

    public AdminShippingSettingsValues toValues() {
        return new AdminShippingSettingsValues(provider, originCep, packageWeightKg, packageHeightCm, packageWidthCm,
            packageLengthCm, superfreteBaseUrl, superfreteToken, superfreteServices, superfreteUserAgent,
            superfreteCartPath, superfreteCheckoutPath, superfreteLabelLinkPath, senderName, senderPhone, senderEmail,
            senderDocument, senderStreet, senderNumber, senderComplement, senderDistrict, senderCity, senderState,
            List.of(new AdminShippingPackageOption("Padrao", 999, packageHeightCm, packageWidthCm, packageLengthCm)),
            false, "17:00", "15:00");
    }
}
