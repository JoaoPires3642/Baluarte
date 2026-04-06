package br.com.baluarte.core.modules.checkout.api;

import br.com.baluarte.core.modules.checkout.application.ShippingQuoteCommand;
import br.com.baluarte.core.modules.checkout.application.ShippingQuoteGateway;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/checkout/shipping")
@RequiredArgsConstructor
public class CheckoutShippingQuoteController {

    private final ShippingQuoteGateway shippingQuoteGateway;

    @PostMapping("/quotes")
    public ApiSuccessResponse<ShippingQuoteResponse> quoteShippingOptions(
        @Valid @RequestBody ShippingQuoteRequest request
    ) {
        ShippingQuoteCommand command = new ShippingQuoteCommand(
            request.destination().cep(),
            request.destination().state(),
            request.itemsCount()
        );

        List<ShippingQuoteOptionResponse> options = shippingQuoteGateway.quote(command)
            .stream()
            .map(option -> new ShippingQuoteOptionResponse(
                option.id(),
                option.label(),
                option.price(),
                option.estimatedDays(),
                option.estimatedDays() + " dia(s)"
            ))
            .toList();

        return ApiSuccessResponse.of(new ShippingQuoteResponse(shippingQuoteGateway.activeProvider(), options));
    }
}
