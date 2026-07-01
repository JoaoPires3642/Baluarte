package br.com.baluarte.core.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Headers de seguranca em todas as respostas da API. Defense-in-depth: o nginx na VPS
 * tambem pode setar os mesmos headers — ter ambos garante cobertura mesmo se o nginx
 * for removido ou mal configurado.
 *
 * <p>O {@code Cache-Control: no-store} evita que intermediarios (CDN, proxy, browser HTTP cache)
 * armazenem respostas com PII. Nao afeta o cache Caffeine em memoria do backend.
 */
@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    private static final String CSP = "default-src 'none'; frame-ancestors 'none'";

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        response.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("Content-Security-Policy", CSP);
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
        response.setHeader("Cache-Control", "no-store");

        filterChain.doFilter(request, response);
    }
}
