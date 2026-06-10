package br.com.baluarte.core.modules.checkout.api;

import br.com.baluarte.core.modules.checkout.infrastructure.StationDeliverySettingsService;
import br.com.baluarte.core.modules.checkout.infrastructure.StationDeliverySettingsValues;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checkout/shipping")
@RequiredArgsConstructor
public class StationDeliveryPublicController {

    private final StationDeliverySettingsService service;

    @GetMapping("/station-settings")
    public ApiSuccessResponse<StationDeliveryResponse> getStationSettings() {
        StationDeliverySettingsValues values = service.get();
        if (!values.enabled()) {
            return ApiSuccessResponse.of(new StationDeliveryResponse(false, null, null, null));
        }
        return new ApiSuccessResponse<>(new StationDeliveryResponse(
            values.enabled(),
            values.price(),
            values.stations(),
            values.timeSlots()
        ), Map.of());
    }
}
