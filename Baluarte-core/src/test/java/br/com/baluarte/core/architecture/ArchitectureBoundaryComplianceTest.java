package br.com.baluarte.core.architecture;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.baluarte.core.modules.catalog.api.CatalogController;
import br.com.baluarte.core.modules.catalog.application.ListPublicCategoriesUseCase;
import br.com.baluarte.core.modules.catalog.domain.Category;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.List;
import org.junit.jupiter.api.Test;

class ArchitectureBoundaryComplianceTest {

    @Test
    void applicationAndDomainLayersShouldNotDependOnSpringTypes() {
        List<Class<?>> innerLayerClasses = List.of(
            ListPublicCategoriesUseCase.class,
            Category.class,
            CategoryRepository.class
        );

        for (Class<?> clazz : innerLayerClasses) {
            assertNoSpringAnnotations(clazz);
            assertNoSpringMemberTypes(clazz);
        }
    }

    @Test
    void controllerShouldDependOnUseCaseNotRepository() {
        for (Field field : CatalogController.class.getDeclaredFields()) {
            assertThat(field.getType())
                .withFailMessage("Controller field %s must not depend on CategoryRepository", field.getName())
                .isNotEqualTo(CategoryRepository.class);
        }
    }

    private static void assertNoSpringAnnotations(Class<?> clazz) {
        for (Annotation annotation : clazz.getDeclaredAnnotations()) {
            assertThat(annotation.annotationType().getName())
                .withFailMessage("Class %s contains Spring annotation %s", clazz.getName(), annotation.annotationType().getName())
                .doesNotStartWith("org.springframework");
        }
    }

    private static void assertNoSpringMemberTypes(Class<?> clazz) {
        for (Field field : clazz.getDeclaredFields()) {
            assertTypeIsNotSpring(clazz, "field " + field.getName(), field.getType());
        }

        for (Method method : clazz.getDeclaredMethods()) {
            assertTypeIsNotSpring(clazz, "return type of method " + method.getName(), method.getReturnType());

            for (Parameter parameter : method.getParameters()) {
                assertTypeIsNotSpring(clazz, "parameter " + parameter.getName() + " of method " + method.getName(), parameter.getType());
            }
        }
    }

    private static void assertTypeIsNotSpring(Class<?> owner, String member, Class<?> type) {
        assertThat(type.getName())
            .withFailMessage("Class %s has Spring dependency at %s: %s", owner.getName(), member, type.getName())
            .doesNotStartWith("org.springframework");
    }
}
