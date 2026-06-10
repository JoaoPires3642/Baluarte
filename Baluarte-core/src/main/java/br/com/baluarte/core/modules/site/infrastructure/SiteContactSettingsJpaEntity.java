package br.com.baluarte.core.modules.site.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "site_contact_settings")
@Getter
@NoArgsConstructor
public class SiteContactSettingsJpaEntity {

    public static final String SINGLETON_ID = "default";

    @Id
    @Column(name = "settings_id", nullable = false, length = 40)
    private String settingsId;

    @Column(name = "footer_message", columnDefinition = "TEXT")
    private String footerMessage;

    @Column(name = "email", length = 160)
    private String email;

    @Column(name = "phone", length = 40)
    private String phone;

    @Column(name = "whatsapp", length = 40)
    private String whatsapp;

    @Column(name = "business_hours", length = 120)
    private String businessHours;

    @Column(name = "instagram_url", length = 300)
    private String instagramUrl;

    @Column(name = "facebook_url", length = 300)
    private String facebookUrl;

    @Column(name = "youtube_url", length = 300)
    private String youtubeUrl;

    @Column(name = "whatsapp_message", columnDefinition = "TEXT")
    private String whatsappMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static SiteContactSettingsJpaEntity defaults() {
        SiteContactSettingsJpaEntity entity = new SiteContactSettingsJpaEntity();
        entity.settingsId = SINGLETON_ID;
        entity.createdAt = LocalDateTime.now();
        entity.apply(new SiteContactSettingsValues(
            "Loja com curadoria premium, atendimento consultivo e coleções esportivas para quem veste o time com identidade.",
            "contato@baluarte.com.br",
            "(11) 99999-9999",
            "(11) 99999-9999",
            "Seg a Sex, 9h às 18h",
            "https://instagram.com",
            "https://facebook.com",
            "https://youtube.com",
            "Ola! Gostaria de mais informacoes sobre os produtos da Baluarte."
        ));
        return entity;
    }

    public void apply(SiteContactSettingsValues values) {
        this.footerMessage = clean(values.footerMessage());
        this.email = clean(values.email());
        this.phone = clean(values.phone());
        this.whatsapp = clean(values.whatsapp());
        this.businessHours = clean(values.businessHours());
        this.instagramUrl = clean(values.instagramUrl());
        this.facebookUrl = clean(values.facebookUrl());
        this.youtubeUrl = clean(values.youtubeUrl());
        this.whatsappMessage = clean(values.whatsappMessage());
        this.updatedAt = LocalDateTime.now();
    }

    public SiteContactSettingsValues toValues() {
        return new SiteContactSettingsValues(
            footerMessage,
            email,
            phone,
            whatsapp,
            businessHours,
            instagramUrl,
            facebookUrl,
            youtubeUrl,
            whatsappMessage
        );
    }

    private String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
