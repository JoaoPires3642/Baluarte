package br.com.baluarte.core.modules.profile.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataProfileAddressJpaRepository extends JpaRepository<ProfileAddressJpaEntity, String> {

    List<ProfileAddressJpaEntity> findAllByUserIdOrderByDefaultAddressDescUpdatedAtDesc(String userId);

    List<ProfileAddressJpaEntity> findAllByUserId(String userId);
}
