package br.com.baluarte.core.modules.adminproduct.domain;

import java.util.Optional;
import java.util.UUID;

public interface AdminProductRepository {

    AdminProduct save(AdminProduct product);

    Optional<AdminProduct> findById(UUID id);
}