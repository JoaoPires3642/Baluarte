package br.com.baluarte.core.shared.auth;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class InternalRoleResolver {

    private final Set<String> adminEmails;

    public InternalRoleResolver(AdminAuthorizationProperties properties) {
        this.adminEmails = properties.getAdminEmails()
            .stream()
            .map(this::normalize)
            .filter(value -> !value.isBlank())
            .collect(Collectors.toSet());
    }

    public InternalRole resolveFromEmail(String email) {
        return adminEmails.contains(normalize(email)) ? InternalRole.ADMIN : InternalRole.CUSTOMER;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}