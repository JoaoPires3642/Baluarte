package br.com.baluarte.core.modules.site.infrastructure;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "site_page")
@Getter
@NoArgsConstructor
public class SitePageJpaEntity {

    @Id
    @Column(name = "slug", nullable = false, length = 80)
    private String slug;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static SitePageJpaEntity defaults(String slug, String title, String content) {
        SitePageJpaEntity entity = new SitePageJpaEntity();
        entity.slug = slug;
        entity.title = title;
        entity.content = content;
        entity.updatedAt = LocalDateTime.now();
        return entity;
    }

    public void apply(SitePageValues values) {
        this.title = values.title();
        this.content = values.content();
        this.updatedAt = LocalDateTime.now();
    }

    public SitePageValues toValues() {
        return new SitePageValues(slug, title, content, updatedAt);
    }
}
