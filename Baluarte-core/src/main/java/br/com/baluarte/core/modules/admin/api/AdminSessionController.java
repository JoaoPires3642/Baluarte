package br.com.baluarte.core.modules.admin.api;

import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import br.com.baluarte.core.shared.auth.AdminAuthFilter;
import br.com.baluarte.core.shared.auth.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminSessionController {

    @GetMapping("/session")
    public ApiSuccessResponse<AdminSessionResponse> getSession(HttpServletRequest request) {
        AuthContext authContext = (AuthContext) request.getAttribute(AdminAuthFilter.AUTH_CONTEXT_REQUEST_ATTRIBUTE);
        AdminSessionResponse data = new AdminSessionResponse(
            authContext.clerkUserId(),
            authContext.clerkEmail(),
            authContext.internalRole().name()
        );
        return ApiSuccessResponse.of(data);
    }
}