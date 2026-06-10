package br.com.baluarte.core.modules.checkout.api;

import br.com.baluarte.core.modules.checkout.infrastructure.StationDeliverySettingsService;
import br.com.baluarte.core.modules.checkout.infrastructure.StationDeliverySettingsValues;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/station-delivery")
@RequiredArgsConstructor
public class StationDeliverySettingsController {

    private final StationDeliverySettingsService service;

    @GetMapping("/settings")
    public ApiSuccessResponse<StationDeliveryResponse> getSettings() {
        return ApiSuccessResponse.of(toResponse(service.get()));
    }

    @PutMapping("/settings")
    public ApiSuccessResponse<StationDeliveryResponse> updateSettings(
        @Valid @RequestBody StationDeliveryRequest request
    ) {
        return ApiSuccessResponse.of(toResponse(service.save(toValues(request))));
    }

    @GetMapping("/info")
    public ApiSuccessResponse<StationDeliveryResponse> getPublicInfo() {
        StationDeliverySettingsValues values = service.get();
        if (!values.enabled()) {
            return ApiSuccessResponse.of(new StationDeliveryResponse(false, null, null, null));
        }
        return ApiSuccessResponse.of(toResponse(values));
    }

    private StationDeliverySettingsValues toValues(StationDeliveryRequest request) {
        return new StationDeliverySettingsValues(
            request.enabled(),
            request.price(),
            request.stations(),
            request.timeSlots()
        );
    }

    private StationDeliveryResponse toResponse(StationDeliverySettingsValues values) {
        return new StationDeliveryResponse(
            values.enabled(),
            values.price(),
            values.stations(),
            values.timeSlots()
        );
    }
}

record StationDeliveryRequest(
    @NotNull Boolean enabled,
    @NotNull @DecimalMin("0.00") BigDecimal price,
    @NotNull Map<String, @NotNull List<@NotBlank String>> stations,
    @NotNull List<@NotBlank String> timeSlots
) {}

record StationDeliveryResponse(
    boolean enabled,
    BigDecimal price,
    Map<String, List<String>> stations,
    List<String> timeSlots
) {}
