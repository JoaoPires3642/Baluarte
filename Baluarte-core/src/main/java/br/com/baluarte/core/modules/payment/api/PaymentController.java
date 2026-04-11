package br.com.baluarte.core.modules.payment.api;

import br.com.baluarte.core.modules.payment.application.CreatePaymentUseCase;
import br.com.baluarte.core.modules.payment.application.PaymentGateway;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final CreatePaymentUseCase createPaymentUseCase;
    private final PaymentGateway paymentGateway;

    @PostMapping("/requests")
    public ApiSuccessResponse<CreatePaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        CreatePaymentResponse response = createPaymentUseCase.execute(request, paymentGateway.activeProvider());
        return ApiSuccessResponse.of(response);
    }
}