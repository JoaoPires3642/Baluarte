package br.com.baluarte.core.modules.adminproduct.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class AdminProductLowStockVariantTest {

    @Test
    void recordComponents() {
        UUID id = UUID.randomUUID();
        var variant = new AdminProductLowStockVariant(id, "Camisa", ProductSize.M, 5);
        assertThat(variant.productId()).isEqualTo(id);
        assertThat(variant.productName()).isEqualTo("Camisa");
        assertThat(variant.size()).isEqualTo(ProductSize.M);
        assertThat(variant.stockQuantity()).isEqualTo(5);
    }
}
