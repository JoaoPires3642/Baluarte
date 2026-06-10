package br.com.baluarte.core.modules.site.infrastructure;

public record SiteContactSettingsValues(
    String footerMessage,
    String email,
    String phone,
    String whatsapp,
    String businessHours,
    String instagramUrl,
    String facebookUrl,
    String youtubeUrl,
    String whatsappMessage
) {
}
