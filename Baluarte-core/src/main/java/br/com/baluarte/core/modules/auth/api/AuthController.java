package br.com.baluarte.core.modules.auth.api;

import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.ClerkJwtVerifier;
import br.com.baluarte.core.shared.auth.InternalRole;
import br.com.baluarte.core.shared.auth.InternalRoleResolver;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final ClerkJwtVerifier clerkJwtVerifier;
    private final InternalRoleResolver internalRoleResolver;

    public AuthController(ClerkJwtVerifier clerkJwtVerifier, InternalRoleResolver internalRoleResolver) {
        this.clerkJwtVerifier = clerkJwtVerifier;
        this.internalRoleResolver = internalRoleResolver;
    }

    @GetMapping("/me")
    public ApiSuccessResponse<AuthMeResponse> me(
        @RequestHeader("Authorization") String authorizationHeader,
        @RequestHeader(value = "X-Clerk-User-Id", required = false) String clerkUserId,
        @RequestHeader(value = "X-Clerk-Email", required = false) String clerkEmail
    ) {
        Jwt jwt = clerkJwtVerifier.verify(extractBearerToken(authorizationHeader));
        if (jwt == null || clerkUserId == null || !clerkUserId.equals(jwt.getSubject())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token or user id mismatch");
        }

        String email = clerkEmail != null ? clerkEmail : (String) jwt.getClaims().get("email");
        if (email == null) {
            email = clerkUserId + "@clerk.users";
        }

        InternalRole role = internalRoleResolver.resolveFromIdentity(clerkUserId, email);
        boolean persisted = internalRoleResolver.existsByIdentity(clerkUserId);

        return ApiSuccessResponse.of(new AuthMeResponse(clerkUserId, email, role.name(), persisted));
    }

    private String extractBearerToken(String header) {
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring(7);
    }

    record AuthMeResponse(String clerkUserId, String email, String role, boolean persisted) {}
}
