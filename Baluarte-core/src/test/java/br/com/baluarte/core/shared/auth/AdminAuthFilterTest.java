package br.com.baluarte.core.shared.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.shared.error.ApiErrorPayload;
import br.com.baluarte.core.shared.error.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.PrintWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminAuthFilterTest {

    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private InternalRoleResolver internalRoleResolver;
    @Mock
    private AdminAuthorizationProperties authorizationProperties;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain chain;
    @Mock
    private PrintWriter writer;

    @Captor
    private ArgumentCaptor<ApiErrorResponse> errorCaptor;

    private AdminAuthFilter filter;

    @BeforeEach
    void setUp() throws Exception {
        filter = new AdminAuthFilter(
            objectMapper, internalRoleResolver, authorizationProperties
        );
        lenient().when(response.getWriter()).thenReturn(writer);
    }

    @Test
    void shouldNotFilterReturnsTrueForOptionsRequest() {
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("OPTIONS");

        boolean result = filter.shouldNotFilter(request);

        assertThat(result).isTrue();
    }

    @Test
    void shouldNotFilterReturnsTrueForNonAdminPath() {
        when(request.getRequestURI()).thenReturn("/api/v1/public/products");
        when(request.getMethod()).thenReturn("GET");

        boolean result = filter.shouldNotFilter(request);

        assertThat(result).isTrue();
    }

    @Test
    void shouldNotFilterReturnsFalseForAdminPath() {
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("GET");

        boolean result = filter.shouldNotFilter(request);

        assertThat(result).isFalse();
    }

    @Test
    void doFilterAllowsRequestWithDevBypass()
        throws Exception {
        when(authorizationProperties.isDevBypassEnabled()).thenReturn(true);
        when(authorizationProperties.getDevBypassKey()).thenReturn("dev-key");
        when(request.getHeader(AdminAuthFilter.DEV_BYPASS_KEY_HEADER))
            .thenReturn("dev-key");
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER))
            .thenReturn("user-1");
        when(request.getHeader(AdminAuthFilter.USER_EMAIL_HEADER))
            .thenReturn("admin@baluarte.com");
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("GET");
        when(internalRoleResolver.resolveFromIdentity("user-1", "admin@baluarte.com"))
            .thenReturn(InternalRole.ADMIN);

        filter.doFilter(request, response, chain);

        verify(request).setAttribute(
            eq(AdminAuthFilter.AUTH_CONTEXT_REQUEST_ATTRIBUTE),
            any(AuthContext.class)
        );
        verify(chain).doFilter(request, response);
    }

    @Test
    void doFilterReturns401WhenUserIdIsMissing()
        throws Exception {
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER))
            .thenReturn(null);
        when(request.getHeader(AdminAuthFilter.USER_EMAIL_HEADER))
            .thenReturn("admin@baluarte.com");
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("GET");

        filter.doFilter(request, response, chain);

        verify(response).setStatus(401);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void doFilterReturns401WhenUserIdIsBlank()
        throws Exception {
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER))
            .thenReturn("   ");
        when(request.getHeader(AdminAuthFilter.USER_EMAIL_HEADER))
            .thenReturn("admin@baluarte.com");
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("GET");

        filter.doFilter(request, response, chain);

        verify(response).setStatus(401);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void doFilterReturns401WhenEmailIsInvalid()
        throws Exception {
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER))
            .thenReturn("user-1");
        when(request.getHeader(AdminAuthFilter.USER_EMAIL_HEADER))
            .thenReturn("not-an-email");
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("GET");

        filter.doFilter(request, response, chain);

        verify(response).setStatus(401);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void doFilterReturns403WhenRoleIsNotAdmin()
        throws Exception {
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER))
            .thenReturn("user-1");
        when(request.getHeader(AdminAuthFilter.USER_EMAIL_HEADER))
            .thenReturn("customer@baluarte.com");
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("GET");
        when(internalRoleResolver.resolveFromIdentity(
            "user-1", "customer@baluarte.com"
        )).thenReturn(InternalRole.CUSTOMER);

        filter.doFilter(request, response, chain);

        verify(response).setStatus(403);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void doFilterAllowsRequestWhenRoleIsAdmin()
        throws Exception {
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER))
            .thenReturn("user-1");
        when(request.getHeader(AdminAuthFilter.USER_EMAIL_HEADER))
            .thenReturn("admin@baluarte.com");
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("GET");
        when(internalRoleResolver.resolveFromIdentity(
            "user-1", "admin@baluarte.com"
        )).thenReturn(InternalRole.ADMIN);

        filter.doFilter(request, response, chain);

        verify(request).setAttribute(
            eq(AdminAuthFilter.AUTH_CONTEXT_REQUEST_ATTRIBUTE),
            any(AuthContext.class)
        );
        verify(chain).doFilter(request, response);
    }

    @Test
    void doFilterWritesJsonErrorResponseWhenUnauthorized()
        throws Exception {
        when(request.getHeader(AdminAuthFilter.USER_ID_HEADER))
            .thenReturn(null);
        when(request.getHeader(AdminAuthFilter.USER_EMAIL_HEADER))
            .thenReturn(null);
        when(request.getRequestURI()).thenReturn("/api/v1/admin/products");
        when(request.getMethod()).thenReturn("GET");

        filter.doFilter(request, response, chain);

        verify(response).setContentType("application/json");
        verify(objectMapper).writeValue(eq(writer), any(ApiErrorResponse.class));
    }
}
