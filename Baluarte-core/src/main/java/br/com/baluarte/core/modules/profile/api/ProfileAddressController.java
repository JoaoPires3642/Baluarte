package br.com.baluarte.core.modules.profile.api;

import br.com.baluarte.core.modules.profile.application.ProfileAddressService;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
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
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]++@[^@\\s.]++\\.[^@\\s]++$");

    private final InternalRoleResolver internalRoleResolver;
    private final ProfileAddressService profileAddressService;

    public ProfileAddressController(
        InternalRoleResolver internalRoleResolver,
        ProfileAddressService profileAddressService
    ) {
        this.internalRoleResolver = internalRoleResolver;
        this.profileAddressService = profileAddressService;
    }

    @GetMapping
    public ResponseEntity<?> listAddresses(
        @RequestHeader(value = "X-User-Id", required = false) String userId,
        @RequestHeader(value = "X-User-Email", required = false) String userEmail,
        HttpServletRequest request
    ) {
        AuthenticatedIdentity identity = resolveIdentity(userId, userEmail, request);
        if (identity == null) {
            return unauthorized(request, "Authentication required", "Invalid identity");
        }

        return ResponseEntity.ok(ApiSuccessResponse.of(profileAddressService.listAddresses(identity.userId())));
    }

    @PutMapping
    public ResponseEntity<?> syncAddresses(
        @RequestHeader(value = "X-User-Id", required = false) String userId,
        @RequestHeader(value = "X-User-Email", required = false) String userEmail,
        @RequestBody ProfileAddressSyncRequest requestBody,
        HttpServletRequest request
    ) {
        AuthenticatedIdentity identity = resolveIdentity(userId, userEmail, request);
        if (identity == null) {
            return unauthorized(request, "Authentication required", "Invalid identity");
        }

        return ResponseEntity.ok(ApiSuccessResponse.of(profileAddressService.syncAddresses(identity.userId(), requestBody)));
    }

    private AuthenticatedIdentity resolveIdentity(
        String userId,
        String userEmail,
        HttpServletRequest request
    ) {
        if (isBlank(userId)) {
            logger.warn(
                "security.audit event=PROFILE_ADDRESS_UNAUTHORIZED reason=missing-user-id path={}",
                request.getRequestURI().replaceAll("[\\r\\n]", "_")
            );
            return null;
        }

        String normalizedUserId = normalize(userId);
        String normalizedEmail = normalize(userEmail);
        String resolvedIdentityEmail = !normalizedEmail.isBlank() ? normalizedEmail
            : normalizedUserId + "@users";

        internalRoleResolver.resolveFromIdentity(normalizedUserId, resolvedIdentityEmail);
        return new AuthenticatedIdentity(normalizedUserId, resolvedIdentityEmail);
    }

    private ResponseEntity<ApiErrorResponse> unauthorized(HttpServletRequest request, String message, String detail) {
        String traceId = request.getAttribute(TraceIdFilter.TRACE_ID_KEY) instanceof String value
            ? value
            : UUID.randomUUID().toString();

        ApiErrorResponse payload = new ApiErrorResponse(new ApiErrorPayload("UNAUTHORIZED", message, List.of(detail)), traceId);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(payload);
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
