package br.com.baluarte.core.modules.auth.api;

import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthSessionController {

    private static final Logger logger = LoggerFactory.getLogger(AuthSessionController.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final ClerkJwtVerifier clerkJwtVerifier;
    private final InternalRoleResolver internalRoleResolver;

    public AuthSessionController(ClerkJwtVerifier clerkJwtVerifier, InternalRoleResolver internalRoleResolver) {
        this.clerkJwtVerifier = clerkJwtVerifier;
        this.internalRoleResolver = internalRoleResolver;
    }

    @GetMapping("/session")
    public ResponseEntity<?> getSession(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail,
        HttpServletRequest request
    ) {
        String token = extractBearerToken(authorizationHeader);
        Jwt jwt = clerkJwtVerifier.verify(token);
        if (jwt == null) {
            return error(request, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required", "Missing or malformed bearer token");
        }

        if (isBlank(clerkUserId) || isBlank(clerkEmail) || !EMAIL_PATTERN.matcher(clerkEmail).matches()) {
            logger.warn(
                "security.audit event=AUTH_ROUTE_UNAUTHORIZED reason=invalid-clerk-identity path={} userId={} email={}",
                request.getRequestURI(),
                clerkUserId,
                clerkEmail
            );
            return error(
                request,
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                "Authentication required",
                "Missing or malformed Clerk identity headers"
            );
        }

        String normalizedHeaderUserId = normalize(clerkUserId);
        String normalizedHeaderEmail = normalize(clerkEmail);
        String normalizedTokenUserId = normalize(jwt.getSubject());
        String normalizedTokenEmail = normalize(extractJwtEmail(jwt));
        boolean hasTokenEmail = !normalizedTokenEmail.isBlank();
        String resolvedIdentityEmail = hasTokenEmail ? normalizedTokenEmail : normalizedHeaderEmail;

        if (
            normalizedTokenUserId.isBlank() ||
            !normalizedTokenUserId.equals(normalizedHeaderUserId) ||
            (hasTokenEmail && !normalizedTokenEmail.equals(normalizedHeaderEmail))
        ) {
            logger.warn(
                "security.audit event=AUTH_ROUTE_UNAUTHORIZED reason=clerk-identity-mismatch path={} headerUserId={} tokenUserId={} headerEmail={} tokenEmail={}",
                request.getRequestURI(),
                clerkUserId,
                jwt.getSubject(),
                clerkEmail,
                extractJwtEmail(jwt)
            );
            return error(
                request,
                HttpStatus.UNAUTHORIZED,
                "UNAUTHORIZED",
                "Authentication required",
                "Clerk identity headers do not match authenticated token claims"
            );
        }

        InternalRole role = internalRoleResolver.resolveFromIdentity(normalizedTokenUserId, resolvedIdentityEmail);
        AuthSessionResponse data = new AuthSessionResponse(
            normalizedTokenUserId,
            resolvedIdentityEmail,
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

    private String extractJwtEmail(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (!isBlank(email)) {
            return email;
        }

        return jwt.getClaimAsString("email_address");
    }

    private String extractBearerToken(String authorizationHeader) {
        if (isBlank(authorizationHeader)) {
            return null;
        }

        String prefix = "Bearer ";
        if (!authorizationHeader.startsWith(prefix)) {
            return null;
        }

        String token = authorizationHeader.substring(prefix.length()).trim();
        return token.isBlank() ? null : token;
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