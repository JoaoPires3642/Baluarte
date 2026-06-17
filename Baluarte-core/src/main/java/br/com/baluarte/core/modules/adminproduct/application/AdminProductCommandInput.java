package br.com.baluarte.core.modules.adminproduct.application;

import java.math.BigDecimal;
import java.util.List;

public interface AdminProductCommandInput {
    String categorySlug();

    String teamSlug();

    String modelName();

    String description();

    BigDecimal price();

    BigDecimal originalPrice();

    String imageUrl();

    List<String> images();

    String sizeCategory();

    List<CreateAdminProductVariantCommand> variants();
}
