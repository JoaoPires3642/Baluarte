package br.com.baluarte.core.shared.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

@Component
public class ClerkJwtVerifier {

    private static final Logger logger = LoggerFactory.getLogger(ClerkJwtVerifier.class);

    private final AdminAuthorizationProperties properties;
    private volatile JwtDecoder jwtDecoder;

    public ClerkJwtVerifier(AdminAuthorizationProperties properties) {
        this.properties = properties;
    }

    public Jwt verify(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }

        try {
            JwtDecoder decoder = getOrCreateDecoder();
            if (decoder == null) {
                logger.warn("security.audit event=ADMIN_AUTH_MISCONFIG reason=missing-clerk-jwt-config");
                return null;
            }
            return decoder.decode(token);
        } catch (JwtException exception) {
            logger.warn("security.audit event=ADMIN_AUTH_INVALID_TOKEN reason={} ", exception.getMessage());
            return null;
        }
    }

    public boolean isValid(String token) {
        return verify(token) != null;
    }

    private JwtDecoder getOrCreateDecoder() {
        JwtDecoder cached = jwtDecoder;
        if (cached != null) {
            return cached;
        }

        String jwksUri = properties.getClerkJwksUri();
        String issuer = properties.getClerkIssuer();
        if (isBlank(jwksUri) || isBlank(issuer)) {
            return null;
        }

        synchronized (this) {
            if (jwtDecoder != null) {
                return jwtDecoder;
            }

            NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri).build();
            OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuer),
                new JwtTimestampValidator()
            );
            decoder.setJwtValidator(validator);
            jwtDecoder = decoder;
            return jwtDecoder;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}