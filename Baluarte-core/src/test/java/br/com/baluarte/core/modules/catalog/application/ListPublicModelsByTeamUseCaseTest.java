package br.com.baluarte.core.modules.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.catalog.application.dto.CatalogModelView;
import br.com.baluarte.core.modules.catalog.domain.CatalogModel;
import br.com.baluarte.core.modules.catalog.domain.CatalogModelRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ListPublicModelsByTeamUseCaseTest {

    @Mock
    private CatalogModelRepository repository;

    @Test
    void executeReturnsMappedModels() {
        var model = new CatalogModel(UUID.randomUUID(), "Camisa", "camisa", "time-a", "img.png", 1, 10);
        when(repository.findPublicModelsByTeamSlug("time-a", 20)).thenReturn(List.of(model));

        var useCase = new ListPublicModelsByTeamUseCase(repository);
        List<CatalogModelView> result = useCase.execute("time-a", 20);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().name()).isEqualTo("Camisa");
    }

    @Test
    void executeBoundsLimitToMax() {
        when(repository.findPublicModelsByTeamSlug("time-a", 100)).thenReturn(List.of());
        var useCase = new ListPublicModelsByTeamUseCase(repository);
        List<CatalogModelView> result = useCase.execute("time-a", 999);
        assertThat(result).isEmpty();
    }

    @Test
    void executeBoundsLimitToMin() {
        when(repository.findPublicModelsByTeamSlug("time-a", 1)).thenReturn(List.of());
        var useCase = new ListPublicModelsByTeamUseCase(repository);
        List<CatalogModelView> result = useCase.execute("time-a", 0);
        assertThat(result).isEmpty();
    }

    @Test
    void executeNormalizesSlug() {
        when(repository.findPublicModelsByTeamSlug("time-a", 20)).thenReturn(List.of());
        var useCase = new ListPublicModelsByTeamUseCase(repository);
        List<CatalogModelView> result = useCase.execute("  TIME-A  ", 20);
        assertThat(result).isEmpty();
    }
}
