package br.com.baluarte.core.shared.auth;

import br.com.baluarte.core.shared.error.ApiErrorPayload;
import br.com.baluarte.core.shared.error.ApiErrorResponse;
import br.com.baluarte.core.shared.error.TraceIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 20)
public class AdminAuthFilter extends OncePerRequestFilter {

    public static final String AUTH_CONTEXT_REQUEST_ATTRIBUTE = "authContext";
    public static final String USER_ID_HEADER = "X-User-Id";
    public static final String USER_EMAIL_HEADER = "X-User-Email";
    public static final String DEV_BYPASS_KEY_HEADER = "X-Admin-Bypass-Key";

    private static final Logger logger = LoggerFactory.getLogger(AdminAuthFilter.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]++@[^@\\s.]++\\.[^@\\s]++$");

    private final ObjectMapper objectMapper;
    private final InternalRoleResolver internalRoleResolver;
    private final AdminAuthorizationProperties authorizationProperties;

    public AdminAuthFilter(
        ObjectMapper objectMapper,
        InternalRoleResolver internalRoleResolver,
        AdminAuthorizationProperties authorizationProperties
    ) {
        this.objectMapper = objectMapper;
        this.internalRoleResolver = internalRoleResolver;
        this.authorizationProperties = authorizationProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        return !path.startsWith("/api/v1/admin");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String userId = request.getHeader(USER_ID_HEADER);
        String userEmail = request.getHeader(USER_EMAIL_HEADER);

        if (tryAuthorizeWithDevBypass(request, userId, userEmail)) {
            filterChain.doFilter(request, response);
            return;
        }

        if (isBlank(userId) || isBlank(userEmail) || !EMAIL_PATTERN.matcher(userEmail).matches()) {
            logger.warn(
                "security.audit event=ADMIN_ROUTE_UNAUTHORIZED reason=invalid-identity path={} userId={} email={}",
                request.getRequestURI(),
                userId,
                userEmail
            );
            writeUnauthorized(response, request, "Missing or malformed identity headers");
            return;
        }

        String normalizedUserId = normalize(userId);
        String normalizedEmail = normalize(userEmail);

        InternalRole role = internalRoleResolver.resolveFromIdentity(normalizedUserId, normalizedEmail);
        if (role != InternalRole.ADMIN) {
            logger.warn(
                "security.audit event=ADMIN_ROUTE_DENIED path={} userId={} email={}",
                request.getRequestURI(),
                normalizedUserId,
                normalizedEmail
            );
            writeForbidden(response, request, "Admin privileges required");
            return;
        }

        request.setAttribute(AUTH_CONTEXT_REQUEST_ATTRIBUTE, new AuthContext(normalizedUserId, normalizedEmail, role));
        filterChain.doFilter(request, response);
    }

    private boolean tryAuthorizeWithDevBypass(HttpServletRequest request, String userId, String userEmail) {
        if (!authorizationProperties.isDevBypassEnabled()) {
            return false;
        }

        String expectedBypassKey = authorizationProperties.getDevBypassKey();
        String requestBypassKey = request.getHeader(DEV_BYPASS_KEY_HEADER);
        if (isBlank(expectedBypassKey) || !expectedBypassKey.equals(requestBypassKey)) {
            return false;
        }

        if (isBlank(userId) || isBlank(userEmail) || !EMAIL_PATTERN.matcher(userEmail).matches()) {
            return false;
        }

        String normalizedUserId = normalize(userId);
        String normalizedEmail = normalize(userEmail);
        InternalRole role = internalRoleResolver.resolveFromIdentity(normalizedUserId, normalizedEmail);
        if (role != InternalRole.ADMIN) {
            return false;
        }

        logger.warn(
            "security.audit event=ADMIN_DEV_BYPASS_GRANTED path={} userId={} email={}",
            request.getRequestURI(),
            normalizedUserId,
            normalizedEmail
        );
        request.setAttribute(AUTH_CONTEXT_REQUEST_ATTRIBUTE, new AuthContext(normalizedUserId, normalizedEmail, role));
        return true;
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

    private void writeUnauthorized(HttpServletResponse response, HttpServletRequest request, String detail) throws IOException {
        writeError(response, request, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required", detail);
    }

    private void writeForbidden(HttpServletResponse response, HttpServletRequest request, String detail) throws IOException {
        writeError(response, request, HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied", detail);
    }

    private void writeError(
        HttpServletResponse response,
        HttpServletRequest request,
        HttpStatus status,
        String code,
        String message,
        String detail
    ) throws IOException {
        String traceId = request.getAttribute(TraceIdFilter.TRACE_ID_KEY) instanceof String value
            ? value
            : UUID.randomUUID().toString();

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiErrorResponse payload = new ApiErrorResponse(new ApiErrorPayload(code, message, List.of(detail)), traceId);
        objectMapper.writeValue(response.getWriter(), payload);
    }
}
