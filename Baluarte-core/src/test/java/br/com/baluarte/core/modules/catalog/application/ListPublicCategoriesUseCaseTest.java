package br.com.baluarte.core.modules.catalog.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ListPublicCategoriesUseCaseTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Test
    void shouldBoundLimitToSafeRangeBeforeCallingRepository() {
        ListPublicCategoriesUseCase useCase = new ListPublicCategoriesUseCase(categoryRepository);

        when(categoryRepository.findPublicCategories(1)).thenReturn(List.of(
            new Category(UUID.randomUUID(), "Destaques", "destaques", 1, true, LocalDateTime.now(), null, null)
        ));
        when(categoryRepository.findPublicCategories(100)).thenReturn(List.of(
            new Category(UUID.randomUUID(), "Times", "times", 2, true, LocalDateTime.now(), null, null)
        ));

        useCase.execute(0);
        useCase.execute(999);

        ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(categoryRepository, org.mockito.Mockito.times(2)).findPublicCategories(limitCaptor.capture());

        assertThat(limitCaptor.getAllValues()).containsExactly(1, 100);
    }
}
