package br.com.baluarte.core.modules.checkout.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "admin_shipping_settings")
@Getter
@NoArgsConstructor
public class AdminShippingSettingsJpaEntity {

    public static final String SINGLETON_ID = "default";

    @Id
    @Column(name = "settings_id", nullable = false, length = 40)
    private String settingsId;

    @Column(name = "provider", nullable = false, length = 40)
    private String provider;

    @Column(name = "origin_cep", nullable = false, length = 9)
    private String originCep;

    @Column(name = "package_weight_kg", nullable = false, precision = 8, scale = 3)
    private BigDecimal packageWeightKg;

    @Column(name = "package_height_cm", nullable = false)
    private Integer packageHeightCm;

    @Column(name = "package_width_cm", nullable = false)
    private Integer packageWidthCm;

    @Column(name = "package_length_cm", nullable = false)
    private Integer packageLengthCm;

    @Column(name = "superfrete_base_url", nullable = false, length = 160)
    private String superfreteBaseUrl;

    @Column(name = "superfrete_token", columnDefinition = "TEXT")
    private String superfreteToken;

    @Column(name = "superfrete_services", nullable = false, length = 80)
    private String superfreteServices;

    @Column(name = "superfrete_user_agent", nullable = false, length = 160)
    private String superfreteUserAgent;

    @Column(name = "superfrete_cart_path", nullable = false, length = 160)
    private String superfreteCartPath;

    @Column(name = "superfrete_checkout_path", nullable = false, length = 160)
    private String superfreteCheckoutPath;

    @Column(name = "superfrete_label_link_path", nullable = false, length = 160)
    private String superfreteLabelLinkPath;

    @Column(name = "sender_name", nullable = false, length = 120)
    private String senderName;

    @Column(name = "sender_phone", nullable = false, length = 40)
    private String senderPhone;

    @Column(name = "sender_email", nullable = false, length = 160)
    private String senderEmail;

    @Column(name = "sender_document", nullable = false, length = 30)
    private String senderDocument;

    @Column(name = "sender_street", nullable = false, length = 120)
    private String senderStreet;

    @Column(name = "sender_number", nullable = false, length = 20)
    private String senderNumber;

    @Column(name = "sender_complement", nullable = false, length = 120)
    private String senderComplement;

    @Column(name = "sender_district", nullable = false, length = 120)
    private String senderDistrict;

    @Column(name = "sender_city", nullable = false, length = 120)
    private String senderCity;

    @Column(name = "sender_state", nullable = false, length = 2)
    private String senderState;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static AdminShippingSettingsJpaEntity defaults(AdminShippingSettingsProperties properties) {
        AdminShippingSettingsJpaEntity entity = new AdminShippingSettingsJpaEntity();
        entity.settingsId = SINGLETON_ID;
        entity.createdAt = LocalDateTime.now();
        entity.apply(properties.toValues());
        return entity;
    }

    public void apply(AdminShippingSettingsValues values) {
        this.provider = value(values.provider(), "superfrete");
        this.originCep = value(values.originCep(), "");
        this.packageWeightKg = values.packageWeightKg();
        this.packageHeightCm = values.packageHeightCm();
        this.packageWidthCm = values.packageWidthCm();
        this.packageLengthCm = values.packageLengthCm();
        this.superfreteBaseUrl = value(values.superfreteBaseUrl(), "https://sandbox.superfrete.com");
        this.superfreteToken = values.superfreteToken();
        this.superfreteServices = value(values.superfreteServices(), "1,2,17");
        this.superfreteUserAgent = value(values.superfreteUserAgent(), "Baluarte/1.0 (contato@baluarte.com)");
        this.superfreteCartPath = value(values.superfreteCartPath(), "/api/v0/cart");
        this.superfreteCheckoutPath = value(values.superfreteCheckoutPath(), "/api/v0/checkout");
        this.superfreteLabelLinkPath = value(values.superfreteLabelLinkPath(), "/api/v0/orders/{id}/tag/link");
        this.senderName = value(values.senderName(), "");
        this.senderPhone = value(values.senderPhone(), "");
        this.senderEmail = value(values.senderEmail(), "");
        this.senderDocument = value(values.senderDocument(), "");
        this.senderStreet = value(values.senderStreet(), "");
        this.senderNumber = value(values.senderNumber(), "");
        this.senderComplement = value(values.senderComplement(), "");
        this.senderDistrict = value(values.senderDistrict(), "");
        this.senderCity = value(values.senderCity(), "");
        this.senderState = value(values.senderState(), "").toUpperCase();
        this.updatedAt = LocalDateTime.now();
    }

    public AdminShippingSettingsValues toValues() {
        return new AdminShippingSettingsValues(provider, originCep, packageWeightKg, packageHeightCm, packageWidthCm,
            packageLengthCm, superfreteBaseUrl, superfreteToken, superfreteServices, superfreteUserAgent,
            superfreteCartPath, superfreteCheckoutPath, superfreteLabelLinkPath, senderName, senderPhone, senderEmail,
            senderDocument, senderStreet, senderNumber, senderComplement, senderDistrict, senderCity, senderState);
    }

    private String value(String value, String fallback) {
        return value == null ? fallback : value.trim();
    }
}
