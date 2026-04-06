package br.com.baluarte.core.modules.profile.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataProfileAddressJpaRepository extends JpaRepository<ProfileAddressJpaEntity, String> {

    List<ProfileAddressJpaEntity> findAllByClerkUserIdOrderByDefaultAddressDescUpdatedAtDesc(String clerkUserId);

    List<ProfileAddressJpaEntity> findAllByClerkUserId(String clerkUserId);
}
