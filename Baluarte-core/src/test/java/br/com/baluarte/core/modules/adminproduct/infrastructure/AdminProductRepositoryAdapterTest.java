package br.com.baluarte.core.modules.adminproduct.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductLowStockVariant;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSizeCategory;
import br.com.baluarte.core.modules.catalog.infrastructure.CategoryJpaEntity;
import br.com.baluarte.core.modules.catalog.infrastructure.SpringDataCategoryJpaRepository;
import br.com.baluarte.core.modules.catalog.infrastructure.SpringDataTeamJpaRepository;
import br.com.baluarte.core.modules.catalog.infrastructure.TeamJpaEntity;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@ExtendWith(MockitoExtension.class)
class AdminProductRepositoryAdapterTest {

    @Mock
    private SpringDataAdminProductJpaRepository productJpaRepository;

    @Mock
    private SpringDataCategoryJpaRepository categoryJpaRepository;

    @Mock
    private SpringDataTeamJpaRepository teamJpaRepository;

    private AdminProductRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new AdminProductRepositoryAdapter(productJpaRepository, categoryJpaRepository, teamJpaRepository);
    }

    private AdminProduct sampleProduct() {
        return new AdminProduct(
            UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
            "camisas", "time-a", "Camisa", "Desc",
            BigDecimal.valueOf(99.90), BigDecimal.valueOf(129.90),
            "https://img.com/1", List.of("https://img.com/1"),
            false, null, null, false, true, true, 10,
            List.of(new AdminProductVariant(UUID.randomUUID(), ProductSize.M, 10, true, LocalDateTime.now())),
            ProductSizeCategory.ADULTO, LocalDateTime.now()
        );
    }

    private AdminProductJpaEntity createEntity(AdminProduct product) {
        var cat = org.mockito.Mockito.mock(CategoryJpaEntity.class);
        lenient().when(cat.getId()).thenReturn(product.categoryId());
        lenient().when(cat.getSlug()).thenReturn("camisas");
        var team = org.mockito.Mockito.mock(TeamJpaEntity.class);
        lenient().when(team.getId()).thenReturn(product.teamId());
        lenient().when(team.getSlug()).thenReturn("time-a");
        return AdminProductJpaEntity.fromDomain(product, cat, team);
    }

    @Test
    void saveCreatesNewProduct() {
        AdminProduct product = sampleProduct();
        var cat = org.mockito.Mockito.mock(CategoryJpaEntity.class);
        lenient().when(cat.getId()).thenReturn(product.categoryId());
        lenient().when(cat.getSlug()).thenReturn("camisas");
        var team = org.mockito.Mockito.mock(TeamJpaEntity.class);
        lenient().when(team.getId()).thenReturn(product.teamId());
        lenient().when(team.getSlug()).thenReturn("time-a");

        when(categoryJpaRepository.findById(product.categoryId())).thenReturn(Optional.of(cat));
        when(teamJpaRepository.findById(product.teamId())).thenReturn(Optional.of(team));
        when(productJpaRepository.findById(product.id())).thenReturn(Optional.empty());
        var savedEntity = AdminProductJpaEntity.fromDomain(product, cat, team);
        when(productJpaRepository.save(any())).thenReturn(savedEntity);

        AdminProduct result = adapter.save(product);

        assertThat(result.id()).isEqualTo(product.id());
    }

    @Test
    void findAllReturnsAllProducts() {
        var entity = createEntity(sampleProduct());
        when(productJpaRepository.findAll(any(Sort.class))).thenReturn(List.of(entity));

        List<AdminProduct> result = adapter.findAll();

        assertThat(result).hasSize(1);
    }

    @Test
    void findActiveAvailableReturnsEmpty() {
        when(productJpaRepository.findByActiveTrueAndAvailableTrueOrderByCreatedAtDesc(any(PageRequest.class)))
            .thenReturn(Page.empty());

        assertThat(adapter.findActiveAvailable(5)).isEmpty();
    }

    @Test
    void findFeaturedActiveAvailableReturnsEmpty() {
        when(productJpaRepository.findByFeaturedTrueAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(any()))
            .thenReturn(List.of());

        assertThat(adapter.findFeaturedActiveAvailable(5)).isEmpty();
    }

    @Test
    void findPublicProductsWithQuery() {
        when(productJpaRepository.searchActiveAvailable("camisa", PageRequest.of(0, 10)))
            .thenReturn(Page.empty());

        assertThat(adapter.findPublicProducts("Camisa", 0, 10)).isEmpty();
    }

    @Test
    void findPublicProductsWithoutQuery() {
        when(productJpaRepository.findByActiveTrueAndAvailableTrueOrderByCreatedAtDesc(any(PageRequest.class)))
            .thenReturn(Page.empty());

        assertThat(adapter.findPublicProducts(null, 0, 10)).isEmpty();
    }

    @Test
    void countFeaturedExcept() {
        UUID id = UUID.randomUUID();
        when(productJpaRepository.countFeaturedExcept(id)).thenReturn(3L);
        assertThat(adapter.countFeaturedExcept(id)).isEqualTo(3);
    }

    @Test
    void findActiveAvailableByTeamSlug() {
        when(productJpaRepository.findByTeamSlugIgnoreCaseAndActiveTrueAndAvailableTrueOrderByCreatedAtDesc(
            anyString(), any(PageRequest.class))).thenReturn(List.of());

        assertThat(adapter.findActiveAvailableByTeamSlug("time-a", 5)).isEmpty();
    }

    @Test
    void findByIdReturnsProduct() {
        var entity = createEntity(sampleProduct());
        when(productJpaRepository.findById(entity.getId())).thenReturn(Optional.of(entity));

        assertThat(adapter.findById(entity.getId())).isPresent();
    }

    @Test
    void findByIdReturnsEmpty() {
        UUID id = UUID.randomUUID();
        when(productJpaRepository.findById(id)).thenReturn(Optional.empty());
        assertThat(adapter.findById(id)).isEmpty();
    }

    @Test
    void countActive() {
        when(productJpaRepository.countByActiveTrue()).thenReturn(5L);
        assertThat(adapter.countActive()).isEqualTo(5);
    }

    @Test
    void findLowStockVariants() {
        LowStockVariantProjection projection = new LowStockVariantProjection() {
            @Override public UUID getProductId() { return UUID.randomUUID(); }
            @Override public String getProductName() { return "Camisa"; }
            @Override public String getSize() { return "M"; }
            @Override public Integer getStockQuantity() { return 3; }
        };
        when(productJpaRepository.findLowStockVariants(5, PageRequest.of(0, 10)))
            .thenReturn(List.of(projection));

        List<AdminProductLowStockVariant> result = adapter.findLowStockVariants(5, 10);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().productName()).isEqualTo("Camisa");
    }
}
