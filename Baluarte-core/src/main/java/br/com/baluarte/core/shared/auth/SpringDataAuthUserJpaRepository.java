package br.com.baluarte.core.shared.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataAuthUserJpaRepository extends JpaRepository<AuthUserJpaEntity, String> {

    Optional<AuthUserJpaEntity> findByEmailIgnoreCase(String email);
}