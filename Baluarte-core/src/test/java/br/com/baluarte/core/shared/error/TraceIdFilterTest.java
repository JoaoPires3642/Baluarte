package br.com.baluarte.core.shared.error;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TraceIdFilterTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain chain;

    private final TraceIdFilter filter = new TraceIdFilter();

    @Test
    void usesTraceIdFromHeader() throws Exception {
        when(request.getHeader("X-Trace-Id")).thenReturn("trace-123");

        filter.doFilterInternal(request, response, chain);

        verify(request).setAttribute("traceId", "trace-123");
        verify(response).setHeader("X-Trace-Id", "trace-123");
        verify(chain).doFilter(request, response);
    }

    @Test
    void generatesTraceIdWhenHeaderMissing() throws Exception {
        when(request.getHeader("X-Trace-Id")).thenReturn(null);

        filter.doFilterInternal(request, response, chain);

        verify(request).setAttribute(eq("traceId"), anyString());
        verify(response).setHeader(eq("X-Trace-Id"), anyString());
        verify(chain).doFilter(request, response);
    }

    @Test
    void cleansMdcInFinally() throws Exception {
        when(request.getHeader("X-Trace-Id")).thenReturn("trace-1");

        filter.doFilterInternal(request, response, chain);

        assertThat(org.slf4j.MDC.get("traceId")).isNull();
    }
}
