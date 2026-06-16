package br.com.baluarte.core.modules.auth.api;

import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.InternalRole;
import br.com.baluarte.core.shared.auth.InternalRoleResolver;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final InternalRoleResolver internalRoleResolver;

    public AuthController(InternalRoleResolver internalRoleResolver) {
        this.internalRoleResolver = internalRoleResolver;
    }

    @GetMapping("/me")
    public ApiSuccessResponse<AuthMeResponse> me(
        @RequestHeader("X-User-Id") String userId,
        @RequestHeader(value = "X-User-Email", required = false) String userEmail
    ) {
        String email = userEmail != null ? userEmail : userId + "@users";
        InternalRole role = internalRoleResolver.resolveFromIdentity(userId, email);
        boolean persisted = internalRoleResolver.existsByIdentity(userId);

        return ApiSuccessResponse.of(new AuthMeResponse(userId, email, role.name(), persisted));
    }

    record AuthMeResponse(String userId, String email, String role, boolean persisted) {}
}
