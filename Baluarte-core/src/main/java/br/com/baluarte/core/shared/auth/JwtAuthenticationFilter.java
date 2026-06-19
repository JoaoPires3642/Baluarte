package br.com.baluarte.core.shared.auth;

import br.com.baluarte.core.shared.error.ApiErrorPayload;
import br.com.baluarte.core.shared.error.ApiErrorResponse;
import br.com.baluarte.core.shared.error.TraceIdFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.LOWEST_PRECEDENCE - 30)
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String PROXY_SECRET_HEADER = "X-Proxy-Secret";
    private static final String UNAUTHORIZED_CODE = "UNAUTHORIZED";

    private static final List<String> PUBLIC_PATH_PREFIXES = List.of(
        "/api/v1/catalog",
        "/api/v1/site/pages/",
        "/api/v1/site/contact-settings",
        "/api/v1/checkout/shipping/quotes",
        "/api/v1/checkout/shipping/station-settings",
        "/api/v1/media/files/",
        "/api/v1/payment/webhooks/",
        "/api/v1/shipping/webhooks/"
    );

    private final ObjectMapper objectMapper;
    private final FusionAuthProperties properties;
    private final SecurityProperties securityProperties;
    private final SpringDataAuthUserJpaRepository authUserRepository;

    private final JwtDecoder jwtDecoder;
    private final Map<String, CachedUserInfo> userInfoCache = new ConcurrentHashMap<>();

    public JwtAuthenticationFilter(
        ObjectMapper objectMapper,
        FusionAuthProperties properties,
        SecurityProperties securityProperties,
        SpringDataAuthUserJpaRepository authUserRepository
    ) {
        this.objectMapper = objectMapper;
        this.properties = properties;
        this.securityProperties = securityProperties;
        this.authUserRepository = authUserRepository;
        this.jwtDecoder = buildDecoder(properties);
    }

    private static JwtDecoder buildDecoder(FusionAuthProperties props) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(props.getJwksUri()).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(props.getIssuer()));
        return decoder;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        if (PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith)) {
            return true;
        }

        String configuredSecret = securityProperties.getProxySecret();
        if (configuredSecret == null || configuredSecret.isBlank()) {
            String auth = request.getHeader(AUTHORIZATION_HEADER);
            return auth == null || !auth.startsWith(BEARER_PREFIX);
        }

        return false;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader(AUTHORIZATION_HEADER);

        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            handleBearerToken(request, response, filterChain, authHeader);
            return;
        }

        String proxySecret = request.getHeader(PROXY_SECRET_HEADER);
        String expectedSecret = securityProperties.getProxySecret();

        if (expectedSecret != null && !expectedSecret.isBlank()
            && proxySecret != null && proxySecret.equals(expectedSecret)) {
            filterChain.doFilter(request, response);
            return;
        }

        logger.warn(
            "security.audit event=AUTH_REJECTED reason=no-valid-credentials path={} method={}",
            request.getRequestURI().replaceAll("[\\r\\n]", "_"),
            request.getMethod()
        );
        writeError(response, request, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_CODE, "Valid Bearer token or proxy secret required");
    }

    private void handleBearerToken(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain,
        String authHeader
    ) throws ServletException, IOException {
        String token = authHeader.substring(BEARER_PREFIX.length()).trim();

        try {
            Jwt jwt = jwtDecoder.decode(token);

            String userId = jwt.getSubject();
            if (userId == null || userId.isBlank()) {
                writeError(response, request, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_CODE, "Invalid token subject");
                return;
            }

            userId = userId.trim().toLowerCase();

            String email = jwt.getClaimAsString("email");
            if (email == null || email.isBlank()) {
                email = resolveEmailFromStore(userId);
            }

            if (email == null || email.isBlank()) {
                writeError(response, request, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_CODE, "Unable to resolve user identity");
                return;
            }

            email = email.trim().toLowerCase();

            String existingUserId = request.getHeader(AdminAuthFilter.USER_ID_HEADER);
            if (existingUserId == null || !existingUserId.trim().equalsIgnoreCase(userId)) {
                request = new HeaderInjectingRequestWrapper(
                    request,
                    AdminAuthFilter.USER_ID_HEADER, userId,
                    AdminAuthFilter.USER_EMAIL_HEADER, email
                );
            }

            filterChain.doFilter(request, response);
        } catch (BadJwtException e) {
            logger.debug("JWT validation failed: {}", e.getMessage());
            writeError(response, request, HttpStatus.UNAUTHORIZED, UNAUTHORIZED_CODE, "Invalid or expired token");
        }
    }

    private String resolveEmailFromStore(String userId) {
        CachedUserInfo cached = userInfoCache.get(userId);
        if (cached != null && cached.isValid(properties.getUserInfoCacheTtl())) {
            return cached.email;
        }

        String email = authUserRepository.findById(userId)
            .map(entity -> entity.getEmail())
            .orElse(null);

        if (email == null || email.isBlank()) {
            email = fetchEmailFromFusionAuth(userId);
        }

        if (email != null && !email.isBlank()) {
            userInfoCache.put(userId, new CachedUserInfo(email, Instant.now()));
        }

        return email;
    }

    private String fetchEmailFromFusionAuth(String userId) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

            String apiBase = properties.getIssuer().startsWith("http") ? properties.getIssuer() : "https://" + properties.getIssuer();
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(apiBase + "/api/user/" + userId))
                .header(AUTHORIZATION_HEADER, properties.getApiKey())
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();

            java.net.http.HttpResponse<String> resp = client.send(req,
                java.net.http.HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == 200) {
                com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(resp.body());
                com.fasterxml.jackson.databind.JsonNode userNode = root.path("user");
                String email = userNode.path("email").asText("");
                if (!email.isBlank()) {
                    AuthUserJpaEntity entity = AuthUserJpaEntity.createDefaultCustomer(userId, email);
                    authUserRepository.save(entity);
                    return email;
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to fetch user info from FusionAuth for userId={}: {}", userId, e.getMessage());
        }
        return null;
    }

    private void writeError(
        HttpServletResponse response,
        HttpServletRequest request,
        HttpStatus status,
        String code,
        String detail
    ) throws IOException {
        String traceId = request.getAttribute(TraceIdFilter.TRACE_ID_KEY) instanceof String value
            ? value
            : UUID.randomUUID().toString();

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiErrorResponse payload = new ApiErrorResponse(
            new ApiErrorPayload(code, "Authentication required", List.of(detail)),
            traceId
        );
        objectMapper.writeValue(response.getWriter(), payload);
    }

    private record CachedUserInfo(String email, Instant fetchedAt) {
        boolean isValid(Duration ttl) {
            return Duration.between(fetchedAt, Instant.now()).compareTo(ttl) < 0;
        }
    }

    private static class HeaderInjectingRequestWrapper extends HttpServletRequestWrapper {
        private final Map<String, String> injectedHeaders;

        HeaderInjectingRequestWrapper(HttpServletRequest request, String key1, String val1, String key2, String val2) {
            super(request);
            this.injectedHeaders = new HashMap<>();
            this.injectedHeaders.put(key1.toLowerCase(), val1);
            this.injectedHeaders.put(key2.toLowerCase(), val2);
        }

        @Override
        public String getHeader(String name) {
            if (name != null && injectedHeaders.containsKey(name.toLowerCase())) {
                return injectedHeaders.get(name.toLowerCase());
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if (name != null && injectedHeaders.containsKey(name.toLowerCase())) {
                return Collections.enumeration(List.of(injectedHeaders.get(name.toLowerCase())));
            }
            return super.getHeaders(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> names = Collections.list(super.getHeaderNames());
            for (String key : injectedHeaders.keySet()) {
                if (!names.contains(key)) {
                    names.add(key);
                }
            }
            return Collections.enumeration(names);
        }
    }
}
