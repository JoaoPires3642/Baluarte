package br.com.baluarte.core.modules.payment.api;

import br.com.baluarte.core.modules.payment.application.CreatePaymentUseCase;
import br.com.baluarte.core.modules.payment.application.PaymentGateway;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final CreatePaymentUseCase createPaymentUseCase;
    private final PaymentGateway paymentGateway;
    private final ClerkJwtVerifier clerkJwtVerifier;

    @PostMapping("/requests")
    public ApiSuccessResponse<CreatePaymentResponse> createPayment(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @Valid @RequestBody CreatePaymentRequest request
    ) {
        Jwt jwt = clerkJwtVerifier.verify(extractBearerToken(authorizationHeader));
        if (jwt == null || clerkUserId == null || !clerkUserId.equals(jwt.getSubject())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        CreatePaymentResponse response = createPaymentUseCase.execute(request, paymentGateway.activeProvider(), jwt.getSubject());
        return ApiSuccessResponse.of(response);
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        return token.isBlank() ? null : token;
    }
}
