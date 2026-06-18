package br.com.baluarte.core.modules.site.infrastructure;

import java.time.LocalDateTime;

public record SitePageValues(
    String slug,
    String title,
    String content,
    LocalDateTime updatedAt
) {
}
