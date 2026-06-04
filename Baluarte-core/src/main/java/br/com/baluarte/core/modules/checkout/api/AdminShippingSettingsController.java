package br.com.baluarte.core.modules.checkout.api;

import br.com.baluarte.core.modules.checkout.infrastructure.AdminShippingSettingsService;
import br.com.baluarte.core.modules.checkout.infrastructure.AdminShippingSettingsValues;
import br.com.baluarte.core.modules.checkout.infrastructure.AdminShippingPackageOption;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/shipping-settings")
@RequiredArgsConstructor
public class AdminShippingSettingsController {

    private final AdminShippingSettingsService service;

    @GetMapping
    public ApiSuccessResponse<AdminShippingSettingsResponse> getSettings() {
        return ApiSuccessResponse.of(toResponse(service.get()));
    }

    @PutMapping
    public ApiSuccessResponse<AdminShippingSettingsResponse> updateSettings(
        @Valid @RequestBody AdminShippingSettingsRequest request
    ) {
        return ApiSuccessResponse.of(toResponse(service.save(toValues(request))));
    }

    private AdminShippingSettingsValues toValues(AdminShippingSettingsRequest request) {
        return new AdminShippingSettingsValues(request.provider(), request.originCep(), request.packageWeightKg(),
            request.packageHeightCm(), request.packageWidthCm(), request.packageLengthCm(), request.superfreteBaseUrl(),
            request.superfreteToken(), request.superfreteServices(), request.superfreteUserAgent(),
            request.superfreteCartPath(), request.superfreteCheckoutPath(), request.superfreteLabelLinkPath(),
            request.senderName(), request.senderPhone(), request.senderEmail(), request.senderDocument(),
            request.senderStreet(), request.senderNumber(), request.senderComplement(), request.senderDistrict(),
            request.senderCity(), request.senderState(), request.packageOptions(), request.automaticLabelEnabled(),
            request.automaticLabelRunTime(), request.automaticLabelCutoffTime());
    }

    private AdminShippingSettingsResponse toResponse(AdminShippingSettingsValues values) {
        return new AdminShippingSettingsResponse(values.provider(), values.originCep(), values.packageWeightKg(),
            values.packageHeightCm(), values.packageWidthCm(), values.packageLengthCm(), values.superfreteBaseUrl(),
            values.superfreteToken() != null && !values.superfreteToken().isBlank(), values.superfreteServices(),
            values.superfreteUserAgent(), values.superfreteCartPath(), values.superfreteCheckoutPath(),
            values.superfreteLabelLinkPath(), values.senderName(), values.senderPhone(), values.senderEmail(),
            values.senderDocument(), values.senderStreet(), values.senderNumber(), values.senderComplement(),
            values.senderDistrict(), values.senderCity(), values.senderState(), values.safePackageOptions(),
            values.automaticLabelEnabled(), values.automaticLabelRunTime(), values.automaticLabelCutoffTime());
    }
}

record AdminShippingSettingsRequest(
    @NotBlank String provider,
    @NotBlank @Pattern(regexp = "^[0-9]{5}-?[0-9]{3}$") String originCep,
    @NotNull @DecimalMin("0.001") BigDecimal packageWeightKg,
    @NotNull @Min(1) Integer packageHeightCm,
    @NotNull @Min(1) Integer packageWidthCm,
    @NotNull @Min(1) Integer packageLengthCm,
    @NotBlank String superfreteBaseUrl,
    String superfreteToken,
    @NotBlank String superfreteServices,
    @NotBlank String superfreteUserAgent,
    @NotBlank String superfreteCartPath,
    @NotBlank String superfreteCheckoutPath,
    @NotBlank String superfreteLabelLinkPath,
    @NotBlank String senderName,
    @NotBlank String senderPhone,
    @Email @NotBlank String senderEmail,
    @NotBlank String senderDocument,
    @NotBlank String senderStreet,
    @NotBlank String senderNumber,
    String senderComplement,
    @NotBlank String senderDistrict,
    @NotBlank String senderCity,
    @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String senderState,
    List<@Valid AdminShippingPackageOption> packageOptions,
    Boolean automaticLabelEnabled,
    @Pattern(regexp = "^([01][0-9]|2[0-3]):[0-5][0-9]$") String automaticLabelRunTime,
    @Pattern(regexp = "^([01][0-9]|2[0-3]):[0-5][0-9]$") String automaticLabelCutoffTime
) {}

record AdminShippingSettingsResponse(
    String provider,
    String originCep,
    BigDecimal packageWeightKg,
    Integer packageHeightCm,
    Integer packageWidthCm,
    Integer packageLengthCm,
    String superfreteBaseUrl,
    boolean superfreteTokenConfigured,
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
) {}
