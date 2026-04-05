package br.com.baluarte.core.shared.auth;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InternalRoleResolver {

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
            return InternalRole.CUSTOMER;
        }

        AuthUserJpaEntity user = authUserRepository.findById(normalizedUserId)
            .orElseGet(() -> AuthUserJpaEntity.createDefaultCustomer(normalizedUserId, normalizedEmail));

        user.touchEmail(normalizedEmail);
        user = authUserRepository.save(user);

        boolean adminFromAllowlist = adminClerkUserIds.contains(normalizedUserId) || adminEmails.contains(normalizedEmail);
        if (adminFromAllowlist) {
            return InternalRole.ADMIN;
        }

        return "admin".equalsIgnoreCase(user.getRole()) ? InternalRole.ADMIN : InternalRole.CUSTOMER;
    }

    public InternalRole resolveFromEmail(String email) {
        return resolveFromIdentity(null, email);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}