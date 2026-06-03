package br.com.baluarte.core.shared.auth;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InternalRoleResolver {

    private static final Logger log = LoggerFactory.getLogger(InternalRoleResolver.class);

    private final Set<String> adminEmails;
    private final Set<String> adminClerkUserIds;
    private final SpringDataAuthUserJpaRepository authUserRepository;

    public InternalRoleResolver(AdminAuthorizationProperties properties, SpringDataAuthUserJpaRepository authUserRepository) {
        this.adminEmails = properties.getAdminEmails()
            .stream()
            .map(this::normalize)
            .filter(value -> !value.isBlank())
            .collect(Collectors.toSet());
        this.adminClerkUserIds = properties.getAdminClerkUserIds()
            .stream()
            .map(this::normalize)
            .filter(value -> !value.isBlank())
            .collect(Collectors.toSet());
        this.authUserRepository = authUserRepository;
    }

    @Transactional
    public InternalRole resolveFromIdentity(String clerkUserId, String email) {
        String normalizedUserId = normalize(clerkUserId);
        String normalizedEmail = normalize(email);

        if (normalizedUserId.isBlank() || normalizedEmail.isBlank()) {
            log.warn("resolveFromIdentity skipped: blank userId or email");
            return InternalRole.CUSTOMER;
        }

        AuthUserJpaEntity existingUser = authUserRepository.findById(normalizedUserId).orElse(null);
        AuthUserJpaEntity user;
        if (existingUser != null) {
            user = existingUser;
            boolean emailChanged = !user.getEmail().equals(normalizedEmail);
            user.touchEmail(normalizedEmail);
            if (emailChanged) {
                authUserRepository.save(user);
            }
        } else {
            user = AuthUserJpaEntity.createDefaultCustomer(normalizedUserId, normalizedEmail);
            authUserRepository.saveAndFlush(user);
            log.info("Created auth_user: clerkUserId={}, email={}", normalizedUserId, normalizedEmail);
        }

        boolean adminFromAllowlist = adminClerkUserIds.contains(normalizedUserId) || adminEmails.contains(normalizedEmail);
        if (adminFromAllowlist) {
            return InternalRole.ADMIN;
        }

        return "admin".equalsIgnoreCase(user.getRole()) ? InternalRole.ADMIN : InternalRole.CUSTOMER;
    }

    public InternalRole resolveFromEmail(String email) {
        return resolveFromIdentity(null, email);
    }

    public boolean existsByIdentity(String clerkUserId) {
        String normalizedUserId = normalize(clerkUserId);
        return !normalizedUserId.isBlank() && authUserRepository.existsById(normalizedUserId);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
