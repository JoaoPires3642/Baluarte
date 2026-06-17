package br.com.baluarte.core.modules.auth.api;

import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.InternalRole;
import br.com.baluarte.core.shared.auth.InternalRoleResolver;
import br.com.baluarte.core.shared.error.ApiErrorPayload;
import br.com.baluarte.core.shared.error.ApiErrorResponse;
import br.com.baluarte.core.shared.error.TraceIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthSessionController {

    private static final Logger logger = LoggerFactory.getLogger(AuthSessionController.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]++@[^@\\s.]++\\.[^@\\s]++$");

    private final InternalRoleResolver internalRoleResolver;

    public AuthSessionController(InternalRoleResolver internalRoleResolver) {
        this.internalRoleResolver = internalRoleResolver;
    }

    @GetMapping("/session")
    public ResponseEntity<?> getSession(
        @RequestHeader(value = "X-User-Id", required = false) String userId,
        @RequestHeader(value = "X-User-Email", required = false) String userEmail,
        HttpServletRequest request
    ) {
        if (isBlank(userId) || isBlank(userEmail) || !EMAIL_PATTERN.matcher(userEmail).matches()) {
            logger.warn(
                "security.audit event=AUTH_ROUTE_UNAUTHORIZED reason=invalid-identity path={} userId={} email={}",
                request.getRequestURI(),
                userId,
                userEmail
            );
            return error(
                request,
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                "Authentication required",
                "Missing or malformed identity headers"
            );
        }

        String normalizedUserId = normalize(userId);
        String normalizedEmail = normalize(userEmail);

        InternalRole role = internalRoleResolver.resolveFromIdentity(normalizedUserId, normalizedEmail);
        AuthSessionResponse data = new AuthSessionResponse(
            normalizedUserId,
            normalizedEmail,
            role == InternalRole.ADMIN ? "admin" : "client"
        );

        return ResponseEntity.ok(ApiSuccessResponse.of(data));
    }

    private ResponseEntity<ApiErrorResponse> error(
        HttpServletRequest request,
        HttpStatus status,
        String code,
        String message,
        String detail
    ) {
        String traceId = request.getAttribute(TraceIdFilter.TRACE_ID_KEY) instanceof String value
            ? value
            : UUID.randomUUID().toString();

        ApiErrorResponse payload = new ApiErrorResponse(new ApiErrorPayload(code, message, List.of(detail)), traceId);
        return ResponseEntity.status(status).body(payload);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        return value.trim().toLowerCase(Locale.ROOT);
    }
}
