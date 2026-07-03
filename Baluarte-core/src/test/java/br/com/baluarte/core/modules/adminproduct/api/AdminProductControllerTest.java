package br.com.baluarte.core.modules.adminproduct.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.application.AdminProductDashboardSummaryView;
import br.com.baluarte.core.modules.adminproduct.application.AdminProductValidationException;
import br.com.baluarte.core.modules.adminproduct.application.CreateAdminProductUseCase;
import br.com.baluarte.core.modules.adminproduct.application.DeactivateAdminProductUseCase;
import br.com.baluarte.core.modules.adminproduct.application.GetAdminProductDashboardSummaryUseCase;
import br.com.baluarte.core.modules.adminproduct.application.ListAdminProductsUseCase;
import br.com.baluarte.core.modules.adminproduct.application.UpdateAdminProductUseCase;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSizeCategory;
import br.com.baluarte.core.shared.api.ApiSuccessResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
@ExtendWith(MockitoExtension.class)
class AdminProductControllerTest {

    @Mock
    private AdminProductRepository adminProductRepository;
    @Mock
    private CreateAdminProductUseCase createAdminProductUseCase;
    @Mock
    private UpdateAdminProductUseCase updateAdminProductUseCase;
    @Mock
    private DeactivateAdminProductUseCase deactivateAdminProductUseCase;
    @Mock
    private ListAdminProductsUseCase listAdminProductsUseCase;
    @Mock
    private GetAdminProductDashboardSummaryUseCase getAdminProductDashboardSummaryUseCase;

    private AdminProductController controller;

    private final UUID productId = UUID.randomUUID();
    private final UUID categoryId = UUID.randomUUID();
    private final UUID teamId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        controller = new AdminProductController(
            adminProductRepository, createAdminProductUseCase,
            updateAdminProductUseCase, deactivateAdminProductUseCase,
            listAdminProductsUseCase, getAdminProductDashboardSummaryUseCase
        );
    }

    private AdminProduct aProduct() {
        return new AdminProduct(
            productId, categoryId, teamId, "camisas", "time-a",
            "Camisa Modelo", "Descricao", BigDecimal.valueOf(99.90),
            BigDecimal.valueOf(129.90), "https://img.com/1",
            List.of("https://img.com/1"), false, null, null, false,
            true, true, 10,
            List.of(new AdminProductVariant(
                UUID.randomUUID(), ProductSize.M, 10, true, LocalDateTime.now()
            )),
            ProductSizeCategory.ADULTO, LocalDateTime.now()
        );
    }

    @Test
    void listProductsReturnsAllProducts() {
        Page<AdminProduct> page = new PageImpl<>(List.of(aProduct()));
        when(listAdminProductsUseCase.execute(0, 20, "", "", "", false, 5)).thenReturn(page);

        ApiSuccessResponse<List<AdminProductResponse>> result = controller.listProducts(0, 20, "", "", "", false, 5);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).modelName()).isEqualTo("Camisa Modelo");
        assertThat(result.meta()).containsEntry("total", 1L);
        assertThat(result.meta()).containsEntry("totalPages", 1);
    }

    @Test
    void listProductsReturnsEmptyWhenNoneExist() {
        Page<AdminProduct> page = new PageImpl<>(List.of());
        when(listAdminProductsUseCase.execute(0, 20, "", "", "", false, 5)).thenReturn(page);

        var result = controller.listProducts(0, 20, "", "", "", false, 5);

        assertThat(result.data()).isEmpty();
    }

    @Test
    void getDashboardSummaryReturnsTransformedData() {
        AdminProductDashboardSummaryView.LowStockVariantView lowStock =
            new AdminProductDashboardSummaryView.LowStockVariantView(
                productId, "Camisa", "M", 3
            );
        var view = new AdminProductDashboardSummaryView(10L, List.of(lowStock));

        when(getAdminProductDashboardSummaryUseCase.execute(5, 50)).thenReturn(view);

        var result = controller.getDashboardSummary(5, 50);

        assertThat(result.data().totalActiveProducts()).isEqualTo(10);
        assertThat(result.data().lowStockVariants()).hasSize(1);
        assertThat(result.data().lowStockVariants().get(0).productName())
            .isEqualTo("Camisa");
    }

    @Test
    void getDashboardSummaryReturnsEmptyWhenNoLowStock() {
        var view = new AdminProductDashboardSummaryView(3L, List.of());

        when(getAdminProductDashboardSummaryUseCase.execute(3, 20)).thenReturn(view);

        var result = controller.getDashboardSummary(3, 20);

        assertThat(result.data().totalActiveProducts()).isEqualTo(3);
        assertThat(result.data().lowStockVariants()).isEmpty();
    }

    @Test
    void createProductReturnsCreatedProduct() {
        var request = new CreateAdminProductRequest(
            "camisas", "time-a", "Camisa Nova", "Descricao",
            BigDecimal.valueOf(99.90), null, null, List.of(),
            false, null, null, false, "ADULTO",
            List.of(new CreateAdminProductVariantRequest("M", 10))
        );
        when(createAdminProductUseCase.execute(any()))
            .thenReturn(aProduct());

        var result = controller.createProduct(request);

        assertThat(result.data().id()).isEqualTo(productId);
        assertThat(result.data().modelName()).isEqualTo("Camisa Modelo");
    }

    @Test
    void updateProductReturnsUpdatedProduct() {
        var request = new UpdateAdminProductRequest(
            "camisas", "time-a", "Camisa Atualizada", "Desc",
            BigDecimal.valueOf(149.90), null, null, List.of(),
            false, null, null, false, "ADULTO",
            List.of(new CreateAdminProductVariantRequest("G", 5))
        );
        when(updateAdminProductUseCase.execute(any()))
            .thenReturn(aProduct());

        var result = controller.updateProduct(productId, request);

        assertThat(result.data().id()).isEqualTo(productId);
    }

    @Test
    void deactivateProductReturnsDeactivatedProduct() {
        when(deactivateAdminProductUseCase.execute(productId))
            .thenReturn(aProduct());

        var result = controller.deactivateProduct(productId);

        assertThat(result.data().id()).isEqualTo(productId);
    }

    @Test
    void toggleProductActiveTogglesActiveFlag() {
        var existing = new AdminProduct(
            productId, categoryId, teamId, "camisas", "time-a",
            "Camisa", "Desc", BigDecimal.valueOf(99.90),
            BigDecimal.valueOf(129.90), "https://img.com/1",
            List.of("https://img.com/1"), false, null, null, false,
            true, true, 10,
            List.of(new AdminProductVariant(
                UUID.randomUUID(), ProductSize.M, 10, true, LocalDateTime.now()
            )),
            ProductSizeCategory.ADULTO, LocalDateTime.now()
        );
        var toggled = new AdminProduct(
            productId, categoryId, teamId, "camisas", "time-a",
            "Camisa", "Desc", BigDecimal.valueOf(99.90),
            BigDecimal.valueOf(129.90), "https://img.com/1",
            List.of("https://img.com/1"), false, null, null, false,
            false, false, 10,
            List.of(new AdminProductVariant(
                UUID.randomUUID(), ProductSize.M, 10, true, LocalDateTime.now()
            )),
            ProductSizeCategory.ADULTO, LocalDateTime.now()
        );

        when(adminProductRepository.findById(productId))
            .thenReturn(Optional.of(existing));
        when(adminProductRepository.save(any())).thenReturn(toggled);

        var result = controller.toggleProductActive(productId);

        assertThat(result.data().active()).isFalse();
    }

    @Test
    void toggleProductActiveThrowsWhenProductNotFound() {
        when(adminProductRepository.findById(productId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.toggleProductActive(productId))
            .isInstanceOf(AdminProductValidationException.class);
    }

    @Test
    void createProductDelegatesToUseCase() {
        var request = new CreateAdminProductRequest(
            "camisas", "time-a", "Nova", "Desc",
            BigDecimal.valueOf(79.90), null, null, List.of(),
            false, null, null, false, "ADULTO",
            List.of(new CreateAdminProductVariantRequest("P", 8))
        );
        when(createAdminProductUseCase.execute(any()))
            .thenReturn(aProduct());

        controller.createProduct(request);

        verify(createAdminProductUseCase).execute(any());
    }

    @Test
    void updateProductDelegatesToUseCase() {
        var request = new UpdateAdminProductRequest(
            "camisas", "time-a", "Att", "Desc",
            BigDecimal.valueOf(99.90), null, null, List.of(),
            false, null, null, false, "ADULTO",
            List.of(new CreateAdminProductVariantRequest("GG", 3))
        );

        when(updateAdminProductUseCase.execute(any()))
            .thenReturn(aProduct());

        controller.updateProduct(productId, request);

        verify(updateAdminProductUseCase).execute(any());
    }
}
