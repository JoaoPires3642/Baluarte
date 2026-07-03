package br.com.baluarte.core.shared.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private SpringDataAuthUserJpaRepository authUserRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain chain;

    @Mock
    private JwtDecoder jwtDecoder;

    @Mock
    private PrintWriter writer;

    private FusionAuthProperties properties;
    private SecurityProperties securityProperties;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() throws Exception {
        properties = new FusionAuthProperties();
        properties.setJwksUri("https://example.com/.well-known/jwks.json");
        properties.setIssuer("https://example.com");
        properties.setApiKey("sk-test");

        securityProperties = new SecurityProperties();
        securityProperties.setProxySecret("test-proxy-secret");

        filter = new JwtAuthenticationFilter(objectMapper, properties, securityProperties, authUserRepository);
        Field decoderField = JwtAuthenticationFilter.class.getDeclaredField("jwtDecoder");
        decoderField.setAccessible(true);
        decoderField.set(filter, jwtDecoder);
        lenient().when(response.getWriter()).thenReturn(writer);
    }

    @Test
    void shouldNotFilterReturnsTrueForOptions() {
        when(request.getMethod()).thenReturn("OPTIONS");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldNotFilterReturnsTrueForPublicCatalogPath() {
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/catalog/products");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldNotFilterReturnsTrueForPublicSitePath() {
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/site/pages/privacidade");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldNotFilterReturnsTrueForWebhookPath() {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/payment/webhooks/mercadopago");
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldNotFilterReturnsFalseForAuthenticatedPath() {
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/profile/addresses");
        assertThat(filter.shouldNotFilter(request)).isFalse();
    }

    @Test
    void shouldNotFilterSkipsWhenNoBearerAndNoProxySecretConfigured() {
        securityProperties.setProxySecret("");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/profile/addresses");
        when(request.getHeader("Authorization")).thenReturn(null);
        assertThat(filter.shouldNotFilter(request)).isTrue();
    }

    @Test
    void shouldNotFilterRunsWhenBearerPresentEvenWithoutProxySecret() {
        securityProperties.setProxySecret("");
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/profile/addresses");
        when(request.getHeader("Authorization")).thenReturn("Bearer tok");
        assertThat(filter.shouldNotFilter(request)).isFalse();
    }

    @Test
    void shouldNotFilterReturnsFalseForAdminPath() {
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        assertThat(filter.shouldNotFilter(request)).isFalse();
    }

    @Test
    void doFilterRejectsWhenNoBearerAndNoProxySecret() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getHeader(JwtAuthenticationFilter.PROXY_SECRET_HEADER)).thenReturn(null);
        when(request.getRequestURI()).thenReturn("/api/v1/profile/addresses");
        when(request.getMethod()).thenReturn("GET");

        filter.doFilterInternal(request, response, chain);

        verify(response).setStatus(401);
        verify(objectMapper).writeValue(any(PrintWriter.class), any());
    }

    @Test
    void doFilterRejectsWhenProxySecretMismatch() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getHeader(JwtAuthenticationFilter.PROXY_SECRET_HEADER)).thenReturn("wrong-secret");
        when(request.getRequestURI()).thenReturn("/api/v1/profile/addresses");
        when(request.getMethod()).thenReturn("GET");

        filter.doFilterInternal(request, response, chain);

        verify(response).setStatus(401);
    }

    @Test
    void doFilterProceedsWhenProxySecretValid() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);
        when(request.getHeader(JwtAuthenticationFilter.PROXY_SECRET_HEADER)).thenReturn("test-proxy-secret");

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void doFilterWritesErrorWhenTokenInvalid() throws Exception {
        when(request.getHeader("Authorization")).thenReturn("Bearer invalid-token");
        when(jwtDecoder.decode("invalid-token")).thenThrow(new BadJwtException("bad token"));

        filter.doFilterInternal(request, response, chain);

        verify(response).setStatus(401);
        verify(objectMapper).writeValue(any(PrintWriter.class), any());
    }

    @Test
    void doFilterWritesErrorWhenSubjectMissing() throws Exception {
        Jwt jwt = Jwt.withTokenValue("tok")
            .header("alg", "RS256")
            .claim("sub", null)
            .claim("email", "a@b.com")
            .build();
        when(request.getHeader("Authorization")).thenReturn("Bearer tok");
        when(jwtDecoder.decode("tok")).thenReturn(jwt);

        filter.doFilterInternal(request, response, chain);

        verify(response).setStatus(401);
    }

    @Test
    void doFilterWritesErrorWhenEmailMissingAndCannotResolve() throws Exception {
        Jwt jwt = Jwt.withTokenValue("tok")
            .header("alg", "RS256")
            .claim("sub", "user-1")
            .claim("email", null)
            .build();
        when(request.getHeader("Authorization")).thenReturn("Bearer tok");
        when(jwtDecoder.decode("tok")).thenReturn(jwt);
        when(authUserRepository.findById("user-1")).thenReturn(Optional.empty());

        filter.doFilterInternal(request, response, chain);

        verify(response).setStatus(401);
    }

    @Test
    void doFilterProceedsWhenUserHasExistingUserIdHeader() throws Exception {
        Jwt jwt = Jwt.withTokenValue("tok")
            .header("alg", "RS256")
            .claim("sub", "user-1")
            .claim("email", "a@b.com")
            .build();
        when(request.getHeader("Authorization")).thenReturn("Bearer tok");
        when(jwtDecoder.decode("tok")).thenReturn(jwt);
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER)).thenReturn("user-1");

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void doFilterInjectsHeadersWhenNoExistingUserId() throws Exception {
        Jwt jwt = Jwt.withTokenValue("tok")
            .header("alg", "RS256")
            .claim("sub", "user-1")
            .claim("email", "a@b.com")
            .build();
        when(request.getHeader("Authorization")).thenReturn("Bearer tok");
        when(jwtDecoder.decode("tok")).thenReturn(jwt);
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER)).thenReturn(null);

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(ArgumentMatchers.any(HttpServletRequest.class), ArgumentMatchers.eq(response));
    }

    @Test
    void doFilterProceedsWithEmailFromStore() throws Exception {
        AuthUserJpaEntity userEntity = AuthUserJpaEntity.createDefaultCustomer("user-1", "stored@b.com");
        Jwt jwt = Jwt.withTokenValue("tok")
            .header("alg", "RS256")
            .claim("sub", "user-1")
            .claim("email", null)
            .build();
        when(request.getHeader("Authorization")).thenReturn("Bearer tok");
        when(jwtDecoder.decode("tok")).thenReturn(jwt);
        when(authUserRepository.findById("user-1")).thenReturn(Optional.of(userEntity));
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER)).thenReturn(null);

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(ArgumentMatchers.any(HttpServletRequest.class), ArgumentMatchers.eq(response));
    }
}
