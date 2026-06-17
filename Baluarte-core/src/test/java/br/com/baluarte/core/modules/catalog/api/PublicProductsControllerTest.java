package br.com.baluarte.core.modules.catalog.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSizeCategory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PublicProductsControllerTest {

    @Mock
    private AdminProductRepository adminProductRepository;

    private PublicProductsController controller;

    @BeforeEach
    void setUp() {
        controller = new PublicProductsController(adminProductRepository);
    }

    private AdminProduct createProduct(UUID id, String teamSlug, String name) {
        var now = LocalDateTime.now();
        return new AdminProduct(
            id, UUID.randomUUID(), UUID.randomUUID(), "cat-slug", teamSlug,
            name, "Description", BigDecimal.TEN, BigDecimal.valueOf(20.0),
            "img.jpg", List.of("img.jpg"), false, null, null,
            true, true, true, 10,
            List.of(new AdminProductVariant(
                UUID.randomUUID(), ProductSize.M, 5, true, now)),
            ProductSizeCategory.ADULTO, now);
    }

    @Test
    void listProductsByTeamReturnsMappedProducts() {
        UUID productId = UUID.randomUUID();
        var product = createProduct(productId, "flamengo",
            "Flamengo 2025 Home Jersey");
        when(adminProductRepository.findActiveAvailableByTeamSlug("flamengo", 50))
            .thenReturn(List.of(product));

        var result = controller.listProductsByTeam("flamengo", 50);

        assertThat(result.data()).hasSize(1);
        var view = result.data().get(0);
        assertThat(view.id()).isEqualTo(productId);
        assertThat(view.name()).isEqualTo("Flamengo 2025 Home Jersey");
        assertThat(view.slug()).isEqualTo("flamengo-2025-home-jersey");
        assertThat(view.teamSlug()).isEqualTo("flamengo");
        assertThat(view.stockQuantity()).isEqualTo(10);
    }

    @Test
    void listProductsByTeamReturnsEmptyWhenNoProducts() {
        when(adminProductRepository.findActiveAvailableByTeamSlug("flamengo", 50))
            .thenReturn(List.of());

        var result = controller.listProductsByTeam("flamengo", 50);

        assertThat(result.data()).isEmpty();
    }

    @Test
    void listProductsByTeamNormalizesSlug() {
        var product = createProduct(UUID.randomUUID(), "flamengo", "Jersey");
        when(adminProductRepository.findActiveAvailableByTeamSlug("flamengo", 50))
            .thenReturn(List.of(product));

        var result = controller.listProductsByTeam("  FLAMENGO  ", 50);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).teamSlug()).isEqualTo("flamengo");
    }
}
