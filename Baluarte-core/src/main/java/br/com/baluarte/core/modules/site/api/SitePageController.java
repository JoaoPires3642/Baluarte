package br.com.baluarte.core.modules.site.api;

import br.com.baluarte.core.modules.site.infrastructure.SitePageService;
import br.com.baluarte.core.modules.site.infrastructure.SitePageValues;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SitePageController {

    private final SitePageService service;

    @GetMapping("/api/v1/site/pages/{slug}")
    public ResponseEntity<ApiSuccessResponse<SitePagePublicResponse>> getPublicPage(@PathVariable String slug) {
        return service.getBySlug(slug)
            .map(values -> ResponseEntity.ok(ApiSuccessResponse.of(toPublicResponse(values))))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/v1/admin/pages")
    public ApiSuccessResponse<List<SitePageAdminResponse>> getAllPages() {
        List<SitePageAdminResponse> pages = service.getAll().stream()
            .map(this::toAdminResponse)
            .toList();
        return ApiSuccessResponse.of(pages);
    }

    @GetMapping("/api/v1/admin/pages/{slug}")
    public ResponseEntity<ApiSuccessResponse<SitePageAdminResponse>> getPage(@PathVariable String slug) {
        return service.getBySlug(slug)
            .map(values -> ResponseEntity.ok(ApiSuccessResponse.of(toAdminResponse(values))))
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/v1/admin/pages/{slug}")
    public ApiSuccessResponse<SitePageAdminResponse> updatePage(
        @PathVariable String slug,
        @Valid @RequestBody SitePageUpdateRequest request
    ) {
        SitePageValues values = service.save(new SitePageValues(slug, request.title(), request.content(), null));
        return ApiSuccessResponse.of(toAdminResponse(values));
    }

    private SitePagePublicResponse toPublicResponse(SitePageValues values) {
        return new SitePagePublicResponse(values.title(), values.content());
    }

    private SitePageAdminResponse toAdminResponse(SitePageValues values) {
        String updatedAt = values.updatedAt() != null ? values.updatedAt().toString() : null;
        return new SitePageAdminResponse(values.slug(), values.title(), values.content(), updatedAt);
    }
}

record SitePagePublicResponse(String title, String content) {
}

record SitePageAdminResponse(String slug, String title, String content, String updatedAt) {
}

record SitePageUpdateRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank String content
) {
}
