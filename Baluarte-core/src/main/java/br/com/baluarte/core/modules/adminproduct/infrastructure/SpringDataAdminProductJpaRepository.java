package br.com.baluarte.core.modules.adminproduct.infrastructure;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataAdminProductJpaRepository extends JpaRepository<AdminProductJpaEntity, UUID> {
}