package br.com.baluarte.core.modules.catalog.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.domain.AdminProduct;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductRepository;
import br.com.baluarte.core.modules.adminproduct.domain.AdminProductVariant;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSize;
import br.com.baluarte.core.modules.adminproduct.domain.ProductSizeCategory;
import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsByCategoryUseCase;
import br.com.baluarte.core.modules.catalog.application.ListPublicTeamsUseCase;
import br.com.baluarte.core.modules.catalog.application.dto.CategoryView;
import br.com.baluarte.core.modules.catalog.application.dto.TeamView;
import java.math.BigDecimal;
import java.sql.ResultSet;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CatalogControllerTest {

    @Mock
    private ListPublicCategoriesUseCase listPublicCategoriesUseCase;

    @Mock
    private ListPublicTeamsUseCase listPublicTeamsUseCase;

    @Mock
    private ListPublicTeamsByCategoryUseCase listPublicTeamsByCategoryUseCase;

    @Mock
    private AdminProductRepository adminProductRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private CatalogController controller;

    @BeforeEach
    void setUp() {
        controller = new CatalogController(
            listPublicCategoriesUseCase, listPublicTeamsUseCase,
            listPublicTeamsByCategoryUseCase, adminProductRepository, jdbcTemplate);
    }

    private AdminProduct createProduct(UUID id, String teamSlug) {
        var now = LocalDateTime.now();
        return new AdminProduct(
            id, UUID.randomUUID(), UUID.randomUUID(), "cat-slug", teamSlug,
            "Model Name", "Description", BigDecimal.TEN, BigDecimal.valueOf(20.0),
            "img.jpg", List.of("img.jpg"), false, null, null,
            true, true, true, 10,
            List.of(new AdminProductVariant(
                UUID.randomUUID(), ProductSize.M, 5, true, now)),
            ProductSizeCategory.ADULTO, now);
    }

    @SuppressWarnings("unchecked")
    private Page<AdminProduct> mockPage(List<AdminProduct> content, int p, int size, long total) {
        var page = mock(Page.class);
        when(page.getContent()).thenReturn(content);
        when(page.getNumber()).thenReturn(p);
        when(page.getSize()).thenReturn(size);
        when(page.getTotalElements()).thenReturn(total);
        when(page.getTotalPages()).thenReturn(Math.max(1, (int) Math.ceil((double) total / size)));
        return page;
    }

    @Test
    void listCategoriesReturnsCategories() {
        var categoryView = new CategoryView(UUID.randomUUID(), "Cat", "cat", 1);
        when(listPublicCategoriesUseCase.execute(50)).thenReturn(List.of(categoryView));

        var result = controller.listCategories(50);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).name()).isEqualTo("Cat");
    }

    @Test
    void listFeaturedProductsReturnsFeatured() {
        var product = createProduct(UUID.randomUUID(), "team-slug");
        when(adminProductRepository.findFeaturedActiveAvailable(8)).thenReturn(List.of(product));

        var result = controller.listFeaturedProducts(8);

        assertThat(result.data()).hasSize(1);
    }

    @Test
    void listFeaturedProductsReturnsEmptyWhenNone() {
        when(adminProductRepository.findFeaturedActiveAvailable(8)).thenReturn(List.of());

        var result = controller.listFeaturedProducts(8);

        assertThat(result.data()).isEmpty();
    }

    @Test
    void listProductsReturnsPagedProducts() {
        var product = createProduct(UUID.randomUUID(), "team-slug");
        var page = mockPage(List.of(product), 0, 10, 1);
        when(adminProductRepository.findPublicProducts("", 0, 10)).thenReturn(page);

        var result = controller.listProducts(0, 10, "");

        assertThat(result.data()).hasSize(1);
        assertThat(result.meta()).containsEntry("page", 0);
        assertThat(result.meta()).containsEntry("total", 1L);
    }

    @Test
    void listBestSellersReturnsEmptyWhenNoSales() {
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), anyInt()))
            .thenReturn(List.of());

        var result = controller.listBestSellers(8);

        assertThat(result.data()).isEmpty();
    }

    @Test
    void listBestSellersReturnsProductsWithSalesCount() throws Exception {
        UUID productId = UUID.randomUUID();
        AdminProduct product = createProduct(productId, "team-slug");
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), anyInt()))
            .thenAnswer(invocation -> {
                RowMapper<?> mapper = invocation.getArgument(1);
                ResultSet rs = mock(ResultSet.class);
                when(rs.getString("product_id")).thenReturn(productId.toString());
                when(rs.getLong("sales_count")).thenReturn(5L);
                return List.of(mapper.mapRow(rs, 0));
            });
        when(adminProductRepository.findById(productId)).thenReturn(Optional.of(product));

        var result = controller.listBestSellers(8);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).salesCount()).isEqualTo(5L);
    }

    @Test
    void listTeamsByCategoryReturnsTeams() {
        var teamView = new TeamView(UUID.randomUUID(), "Team", "team",
            "cat-slug", "League", 1, "logo");
        when(listPublicTeamsByCategoryUseCase.execute("cat-slug", 50))
            .thenReturn(List.of(teamView));

        var result = controller.listTeamsByCategory("cat-slug", 50);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).slug()).isEqualTo("team");
    }

    @Test
    void listTeamsReturnsTeams() {
        var teamView = new TeamView(UUID.randomUUID(), "Team", "team",
            "cat-slug", "League", 1, "logo");
        when(listPublicTeamsUseCase.execute(8)).thenReturn(List.of(teamView));

        var result = controller.listTeams(8);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).slug()).isEqualTo("team");
    }

    @Test
    void listModelsByTeamReturnsModels() {
        var product = createProduct(UUID.randomUUID(), "team-slug");
        when(adminProductRepository.findActiveAvailableByTeamSlug("team-slug", 50))
            .thenReturn(List.of(product));

        var result = controller.listModelsByTeam("team-slug", 50);

        assertThat(result.data()).hasSize(1);
    }

    @Test
    void getModelByTeamAndIdReturnsModelWhenFound() {
        UUID id = UUID.randomUUID();
        var product = createProduct(id, "team-slug");
        when(adminProductRepository.findById(id)).thenReturn(Optional.of(product));

        var result = controller.getModelByTeamAndId("team-slug", id);

        assertThat(result.data().id()).isEqualTo(id);
    }

    @Test
    void getModelByTeamAndIdThrowsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(adminProductRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getModelByTeamAndId("team-slug", id))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getModelByTeamAndIdThrowsWhenTeamSlugMismatch() {
        UUID id = UUID.randomUUID();
        var product = createProduct(id, "other-team");
        when(adminProductRepository.findById(id)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> controller.getModelByTeamAndId("team-slug", id))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void getModelByIdReturnsModelWhenFound() {
        UUID id = UUID.randomUUID();
        var product = createProduct(id, "team-slug");
        when(adminProductRepository.findById(id)).thenReturn(Optional.of(product));

        var result = controller.getModelById(id);

        assertThat(result.data().id()).isEqualTo(id);
    }

    @Test
    void getModelByIdThrowsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(adminProductRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getModelById(id))
            .isInstanceOf(ResponseStatusException.class);
    }
}
