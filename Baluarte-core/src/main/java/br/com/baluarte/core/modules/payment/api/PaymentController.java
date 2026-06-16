package br.com.baluarte.core.modules.payment.api;

import br.com.baluarte.core.modules.payment.application.CreatePaymentUseCase;
import br.com.baluarte.core.modules.payment.application.PaymentGateway;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final CreatePaymentUseCase createPaymentUseCase;
    private final PaymentGateway paymentGateway;

    @PostMapping("/requests")
    public ApiSuccessResponse<CreatePaymentResponse> createPayment(
        @RequestHeader("X-User-Id") String userId,
        @Valid @RequestBody CreatePaymentRequest request
    ) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        CreatePaymentResponse response = createPaymentUseCase.execute(request, paymentGateway.activeProvider(), userId);
        return ApiSuccessResponse.of(response);
    }
}
