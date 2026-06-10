package br.com.baluarte.core.modules.site.api;

import br.com.baluarte.core.modules.site.infrastructure.SiteContactSettingsService;
import br.com.baluarte.core.modules.site.infrastructure.SiteContactSettingsValues;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SiteContactSettingsController {

    private final SiteContactSettingsService service;

    @GetMapping("/api/v1/site/contact-settings")
    public ApiSuccessResponse<SiteContactSettingsResponse> getPublicSettings() {
        return ApiSuccessResponse.of(toResponse(service.get()));
    }

    @GetMapping("/api/v1/admin/contact-settings")
    public ApiSuccessResponse<SiteContactSettingsResponse> getAdminSettings() {
        return ApiSuccessResponse.of(toResponse(service.get()));
    }

    @PutMapping("/api/v1/admin/contact-settings")
    public ApiSuccessResponse<SiteContactSettingsResponse> updateSettings(
        @Valid @RequestBody SiteContactSettingsRequest request
    ) {
        return ApiSuccessResponse.of(toResponse(service.save(toValues(request))));
    }

    private SiteContactSettingsValues toValues(SiteContactSettingsRequest request) {
        return new SiteContactSettingsValues(
            request.footerMessage(),
            request.email(),
            request.phone(),
            request.whatsapp(),
            request.businessHours(),
            request.instagramUrl(),
            request.facebookUrl(),
            request.youtubeUrl()
        );
    }

    private SiteContactSettingsResponse toResponse(SiteContactSettingsValues values) {
        return new SiteContactSettingsResponse(
            values.footerMessage(),
            values.email(),
            values.phone(),
            values.whatsapp(),
            values.businessHours(),
            values.instagramUrl(),
            values.facebookUrl(),
            values.youtubeUrl()
        );
    }
}

record SiteContactSettingsRequest(
    @Size(max = 600) String footerMessage,
    @Email @Size(max = 160) String email,
    @Size(max = 40) String phone,
    @Size(max = 40) String whatsapp,
    @Size(max = 120) String businessHours,
    @Size(max = 300) String instagramUrl,
    @Size(max = 300) String facebookUrl,
    @Size(max = 300) String youtubeUrl
) {
}

record SiteContactSettingsResponse(
    String footerMessage,
    String email,
    String phone,
    String whatsapp,
    String businessHours,
    String instagramUrl,
    String facebookUrl,
    String youtubeUrl
) {
}
