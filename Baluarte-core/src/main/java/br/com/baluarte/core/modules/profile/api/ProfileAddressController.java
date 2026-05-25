package br.com.baluarte.core.modules.profile.api;

import br.com.baluarte.core.modules.profile.application.ProfileAddressService;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
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
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/profile/addresses")
@Validated
public class ProfileAddressController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileAddressController.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final ClerkJwtVerifier clerkJwtVerifier;
    private final InternalRoleResolver internalRoleResolver;
    private final ProfileAddressService profileAddressService;

    public ProfileAddressController(
        ClerkJwtVerifier clerkJwtVerifier,
        InternalRoleResolver internalRoleResolver,
        ProfileAddressService profileAddressService
    ) {
        this.clerkJwtVerifier = clerkJwtVerifier;
        this.internalRoleResolver = internalRoleResolver;
        this.profileAddressService = profileAddressService;
    }

    @GetMapping
    public ResponseEntity<?> listAddresses(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail,
        HttpServletRequest request
    ) {
        AuthenticatedIdentity identity = resolveIdentity(authorizationHeader, clerkUserId, clerkEmail, request);
        if (identity == null) {
            return unauthorized(request, "Authentication required", "Invalid Clerk identity");
        }

        return ResponseEntity.ok(ApiSuccessResponse.of(profileAddressService.listAddresses(identity.userId())));
    }

    @PutMapping
    public ResponseEntity<?> syncAddresses(
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail,
        @RequestBody ProfileAddressSyncRequest requestBody,
        HttpServletRequest request
    ) {
        AuthenticatedIdentity identity = resolveIdentity(authorizationHeader, clerkUserId, clerkEmail, request);
        if (identity == null) {
            return unauthorized(request, "Authentication required", "Invalid Clerk identity");
        }

        return ResponseEntity.ok(ApiSuccessResponse.of(profileAddressService.syncAddresses(identity.userId(), requestBody)));
    }

    private AuthenticatedIdentity resolveIdentity(
        String authorizationHeader,
        String clerkUserId,
        String clerkEmail,
        HttpServletRequest request
    ) {
        String token = extractBearerToken(authorizationHeader);
        Jwt jwt = clerkJwtVerifier.verify(token);
        if (jwt == null) {
            return null;
        }

        if (isBlank(clerkUserId)) {
            logger.warn(
                "security.audit event=PROFILE_ADDRESS_UNAUTHORIZED reason=missing-clerk-user-id path={}",
                request.getRequestURI()
            );
            return null;
        }

        String normalizedHeaderUserId = normalize(clerkUserId);
        String normalizedTokenUserId = normalize(jwt.getSubject());

        if (normalizedTokenUserId.isBlank() || !normalizedTokenUserId.equals(normalizedHeaderUserId)) {
            logger.warn(
                "security.audit event=PROFILE_ADDRESS_UNAUTHORIZED reason=clerk-identity-mismatch path={} headerUserId={} tokenUserId={}",
                request.getRequestURI(),
                clerkUserId,
                jwt.getSubject()
            );
            return null;
        }

        String normalizedHeaderEmail = normalize(clerkEmail);
        String normalizedTokenEmail = normalize(extractJwtEmail(jwt));
        String resolvedIdentityEmail = !normalizedTokenEmail.isBlank() ? normalizedTokenEmail
            : !normalizedHeaderEmail.isBlank() ? normalizedHeaderEmail
            : normalizedHeaderUserId + "@clerk.users";

        internalRoleResolver.resolveFromIdentity(normalizedTokenUserId, resolvedIdentityEmail);
        return new AuthenticatedIdentity(normalizedTokenUserId, resolvedIdentityEmail);
    }

    private ResponseEntity<ApiErrorResponse> unauthorized(HttpServletRequest request, String message, String detail) {
        String traceId = request.getAttribute(TraceIdFilter.TRACE_ID_KEY) instanceof String value
            ? value
            : UUID.randomUUID().toString();

        ApiErrorResponse payload = new ApiErrorResponse(new ApiErrorPayload("UNAUTHORIZED", message, List.of(detail)), traceId);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(payload);
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

    private record AuthenticatedIdentity(String userId, String email) {
    }
}
