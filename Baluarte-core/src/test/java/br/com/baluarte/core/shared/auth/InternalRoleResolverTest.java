package br.com.baluarte.core.shared.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InternalRoleResolverTest {

    @Mock
    private AdminAuthorizationProperties properties;

    @Mock
    private SpringDataAuthUserJpaRepository authUserRepository;

    private InternalRoleResolver resolver;

    @BeforeEach
    void setUp() {
        when(properties.getAdminEmails()).thenReturn(List.of());
        when(properties.getAdminUserIds()).thenReturn(List.of());
        resolver = new InternalRoleResolver(properties, authUserRepository);
    }

    @Test
    void resolveFromIdentityReturnsCustomerForBlankUserId() {
        assertThat(resolver.resolveFromIdentity(null, "a@b.com"))
            .isEqualTo(InternalRole.CUSTOMER);
    }

    @Test
    void resolveFromIdentityReturnsCustomerForBlankEmail() {
        assertThat(resolver.resolveFromIdentity("user-1", null))
            .isEqualTo(InternalRole.CUSTOMER);
    }

    @Test
    void resolveFromIdentityCreatesNewUserAndReturnsCustomer() {
        when(authUserRepository.findById("user-1")).thenReturn(Optional.empty());
        AuthUserJpaEntity newUser = AuthUserJpaEntity.createDefaultCustomer("user-1", "a@b.com");
        when(authUserRepository.saveAndFlush(any())).thenReturn(newUser);

        InternalRole role = resolver.resolveFromIdentity("user-1", "a@b.com");

        assertThat(role).isEqualTo(InternalRole.CUSTOMER);
        verify(authUserRepository).saveAndFlush(any());
    }

    @Test
    void resolveFromIdentityReturnsAdminFromUserIdAllowlist() {
        when(properties.getAdminUserIds()).thenReturn(List.of("user-1"));
        resolver = new InternalRoleResolver(properties, authUserRepository);
        when(authUserRepository.findById("user-1")).thenReturn(Optional.empty());
        AuthUserJpaEntity newUser = AuthUserJpaEntity.createDefaultCustomer("user-1", "a@b.com");
        when(authUserRepository.saveAndFlush(any())).thenReturn(newUser);

        InternalRole role = resolver.resolveFromIdentity("user-1", "a@b.com");

        assertThat(role).isEqualTo(InternalRole.ADMIN);
    }

    @Test
    void resolveFromIdentityReturnsAdminFromEmailAllowlist() {
        when(properties.getAdminEmails()).thenReturn(List.of("admin@test.com"));
        resolver = new InternalRoleResolver(properties, authUserRepository);
        when(authUserRepository.findById("user-1")).thenReturn(Optional.empty());
        AuthUserJpaEntity newUser = AuthUserJpaEntity.createDefaultCustomer("user-1", "admin@test.com");
        when(authUserRepository.saveAndFlush(any())).thenReturn(newUser);

        InternalRole role = resolver.resolveFromIdentity("user-1", "admin@test.com");

        assertThat(role).isEqualTo(InternalRole.ADMIN);
    }

    @Test
    void resolveFromIdentityReturnsAdminWhenExistingUserHasAdminRole() {
        AuthUserJpaEntity existing = AuthUserJpaEntity.createDefaultCustomer("user-1", "a@b.com");
        existing.setRole("admin");
        when(authUserRepository.findById("user-1")).thenReturn(Optional.of(existing));

        InternalRole role = resolver.resolveFromIdentity("user-1", "a@b.com");

        assertThat(role).isEqualTo(InternalRole.ADMIN);
    }

    @Test
    void resolveFromIdentityReturnsCustomerWhenExistingUserHasClientRole() {
        AuthUserJpaEntity existing = AuthUserJpaEntity.createDefaultCustomer("user-1", "a@b.com");
        when(authUserRepository.findById("user-1")).thenReturn(Optional.of(existing));

        InternalRole role = resolver.resolveFromIdentity("user-1", "a@b.com");

        assertThat(role).isEqualTo(InternalRole.CUSTOMER);
    }

    @Test
    void resolveFromIdentitySavesWhenExistingUserEmailChanged() {
        AuthUserJpaEntity existing = AuthUserJpaEntity.createDefaultCustomer("user-1", "old@b.com");
        when(authUserRepository.findById("user-1")).thenReturn(Optional.of(existing));

        resolver.resolveFromIdentity("user-1", "new@b.com");

        verify(authUserRepository).save(existing);
        assertThat(existing.getEmail()).isEqualTo("new@b.com");
    }

    @Test
    void resolveFromEmailReturnsCustomerForBlankUserId() {
        InternalRole role = resolver.resolveFromEmail("a@b.com");
        assertThat(role).isEqualTo(InternalRole.CUSTOMER);
    }

    @Test
    void existsByIdentityReturnsTrueWhenExists() {
        when(authUserRepository.existsById("user-1")).thenReturn(true);
        assertThat(resolver.existsByIdentity("user-1")).isTrue();
    }

    @Test
    void existsByIdentityReturnsFalseForBlank() {
        assertThat(resolver.existsByIdentity(null)).isFalse();
        assertThat(resolver.existsByIdentity("")).isFalse();
    }
}
