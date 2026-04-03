package br.com.baluarte.core.architecture;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.baluarte.core.modules.catalog.api.CatalogController;
import br.com.baluarte.core.modules.catalog.domain.CategoryRepository;
import java.lang.annotation.Annotation;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.GenericArrayType;
import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.lang.reflect.TypeVariable;
import java.lang.reflect.WildcardType;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class ArchitectureBoundaryComplianceTest {

    private static final String CATALOG_APPLICATION_PACKAGE = "br.com.baluarte.core.modules.catalog.application";
    private static final String CATALOG_DOMAIN_PACKAGE = "br.com.baluarte.core.modules.catalog.domain";
    private static final String CATALOG_API_PACKAGE = "br.com.baluarte.core.modules.catalog.api";
    private static final String INFRASTRUCTURE_PACKAGE_MARKER = ".infrastructure";

    @Test
    void applicationAndDomainLayersShouldNotDependOnSpringTypes() {
        Set<Class<?>> innerLayerClasses = new HashSet<>();
        innerLayerClasses.addAll(discoverClassesInPackage(CATALOG_APPLICATION_PACKAGE));
        innerLayerClasses.addAll(discoverClassesInPackage(CATALOG_DOMAIN_PACKAGE));

        for (Class<?> clazz : innerLayerClasses) {
            assertNoSpringAnnotations(clazz);
            assertNoSpringMemberTypes(clazz);
        }
    }

    @Test
    void controllerShouldDependOnUseCaseNotRepository() {
        Set<Class<?>> controllerClasses = discoverClassesInPackage(CATALOG_API_PACKAGE);

        assertThat(controllerClasses)
            .withFailMessage("No controller classes were discovered in package %s", CATALOG_API_PACKAGE)
            .isNotEmpty();

        for (Class<?> controllerClass : controllerClasses) {
            if (!CatalogController.class.isAssignableFrom(controllerClass)) {
                continue;
            }

            for (Field field : controllerClass.getDeclaredFields()) {
                assertControllerTypeAllowed(controllerClass, "field " + field.getName(), field.getGenericType());
            }

            for (Constructor<?> constructor : controllerClass.getDeclaredConstructors()) {
                assertControllerTypeAllowed(controllerClass, "constructor return", constructor.getDeclaringClass());

                for (Parameter parameter : constructor.getParameters()) {
                    assertControllerTypeAllowed(
                        controllerClass,
                        "constructor parameter " + parameter.getName(),
                        parameter.getParameterizedType()
                    );
                }
            }

            for (Method method : controllerClass.getDeclaredMethods()) {
                assertControllerTypeAllowed(controllerClass, "method return " + method.getName(), method.getGenericReturnType());

                for (Parameter parameter : method.getParameters()) {
                    assertControllerTypeAllowed(
                        controllerClass,
                        "method parameter " + parameter.getName() + " of " + method.getName(),
                        parameter.getParameterizedType()
                    );
                }
            }
        }
    }

    private static void assertNoSpringAnnotations(Class<?> clazz) {
        assertThat(hasSpringAnnotation(clazz.getDeclaredAnnotations(), new HashSet<>()))
            .withFailMessage("Class %s contains direct or meta Spring annotation", clazz.getName())
            .isFalse();
    }

    private static void assertNoSpringMemberTypes(Class<?> clazz) {
        for (Field field : clazz.getDeclaredFields()) {
            assertThat(hasSpringAnnotation(field.getDeclaredAnnotations(), new HashSet<>()))
                .withFailMessage("Class %s has field annotation depending on Spring: %s", clazz.getName(), field.getName())
                .isFalse();
            assertTypeIsNotSpring(clazz, "field " + field.getName(), field.getGenericType());
        }

        for (Constructor<?> constructor : clazz.getDeclaredConstructors()) {
            assertThat(hasSpringAnnotation(constructor.getDeclaredAnnotations(), new HashSet<>()))
                .withFailMessage("Class %s has constructor annotation depending on Spring", clazz.getName())
                .isFalse();

            for (Parameter parameter : constructor.getParameters()) {
                assertThat(hasSpringAnnotation(parameter.getDeclaredAnnotations(), new HashSet<>()))
                    .withFailMessage("Class %s has Spring parameter annotation at constructor", clazz.getName())
                    .isFalse();
                assertTypeIsNotSpring(clazz, "constructor parameter " + parameter.getName(), parameter.getParameterizedType());
            }
        }

        for (Method method : clazz.getDeclaredMethods()) {
            assertThat(hasSpringAnnotation(method.getDeclaredAnnotations(), new HashSet<>()))
                .withFailMessage("Class %s has method annotation depending on Spring: %s", clazz.getName(), method.getName())
                .isFalse();
            assertTypeIsNotSpring(clazz, "return type of method " + method.getName(), method.getGenericReturnType());

            for (Parameter parameter : method.getParameters()) {
                assertThat(hasSpringAnnotation(parameter.getDeclaredAnnotations(), new HashSet<>()))
                    .withFailMessage("Class %s has Spring parameter annotation at method %s", clazz.getName(), method.getName())
                    .isFalse();
                assertTypeIsNotSpring(clazz, "parameter " + parameter.getName() + " of method " + method.getName(), parameter.getParameterizedType());
            }
        }
    }

    private static void assertTypeIsNotSpring(Class<?> owner, String member, Type type) {
        assertThat(isSpringType(type))
            .withFailMessage("Class %s has Spring dependency at %s: %s", owner.getName(), member, type.getTypeName())
            .isFalse();
    }

    private static void assertControllerTypeAllowed(Class<?> controllerClass, String member, Type type) {
        assertThat(isForbiddenControllerType(type))
            .withFailMessage(
                "Controller %s has forbidden dependency at %s: %s",
                controllerClass.getName(),
                member,
                type.getTypeName()
            )
            .isFalse();
    }

    private static boolean isForbiddenControllerType(Type type) {
        if (type instanceof Class<?> clazz) {
            if (CategoryRepository.class.isAssignableFrom(clazz)) {
                return true;
            }

            Package pkg = clazz.getPackage();
            return pkg != null && pkg.getName().contains(INFRASTRUCTURE_PACKAGE_MARKER);
        }

        if (type instanceof ParameterizedType parameterizedType) {
            if (isForbiddenControllerType(parameterizedType.getRawType())) {
                return true;
            }

            for (Type actualTypeArgument : parameterizedType.getActualTypeArguments()) {
                if (isForbiddenControllerType(actualTypeArgument)) {
                    return true;
                }
            }
            return false;
        }

        if (type instanceof GenericArrayType genericArrayType) {
            return isForbiddenControllerType(genericArrayType.getGenericComponentType());
        }

        if (type instanceof TypeVariable<?> typeVariable) {
            for (Type bound : typeVariable.getBounds()) {
                if (isForbiddenControllerType(bound)) {
                    return true;
                }
            }
            return false;
        }

        if (type instanceof WildcardType wildcardType) {
            for (Type upperBound : wildcardType.getUpperBounds()) {
                if (isForbiddenControllerType(upperBound)) {
                    return true;
                }
            }

            for (Type lowerBound : wildcardType.getLowerBounds()) {
                if (isForbiddenControllerType(lowerBound)) {
                    return true;
                }
            }
            return false;
        }

        return false;
    }

    private static boolean isSpringType(Type type) {
        if (type instanceof Class<?> clazz) {
            if (clazz.getName().startsWith("org.springframework")) {
                return true;
            }

            if (clazz.isArray()) {
                return isSpringType(clazz.getComponentType());
            }

            return false;
        }

        if (type instanceof ParameterizedType parameterizedType) {
            if (isSpringType(parameterizedType.getRawType())) {
                return true;
            }

            for (Type actualTypeArgument : parameterizedType.getActualTypeArguments()) {
                if (isSpringType(actualTypeArgument)) {
                    return true;
                }
            }
            return false;
        }

        if (type instanceof GenericArrayType genericArrayType) {
            return isSpringType(genericArrayType.getGenericComponentType());
        }

        if (type instanceof TypeVariable<?> typeVariable) {
            for (Type bound : typeVariable.getBounds()) {
                if (isSpringType(bound)) {
                    return true;
                }
            }
            return false;
        }

        if (type instanceof WildcardType wildcardType) {
            for (Type upperBound : wildcardType.getUpperBounds()) {
                if (isSpringType(upperBound)) {
                    return true;
                }
            }

            for (Type lowerBound : wildcardType.getLowerBounds()) {
                if (isSpringType(lowerBound)) {
                    return true;
                }
            }
            return false;
        }

        return false;
    }

    private static boolean hasSpringAnnotation(Annotation[] annotations, Set<Class<?>> visited) {
        for (Annotation annotation : annotations) {
            Class<? extends Annotation> annotationType = annotation.annotationType();
            if (annotationType.getName().startsWith("org.springframework")) {
                return true;
            }

            if (visited.add(annotationType) && hasSpringAnnotation(annotationType.getDeclaredAnnotations(), visited)) {
                return true;
            }
        }

        return false;
    }

    private static Set<Class<?>> discoverClassesInPackage(String packageName) {
        Set<Class<?>> classes = new HashSet<>();
        String packagePath = packageName.replace('.', '/');

        try {
            Enumeration<java.net.URL> resources = Thread.currentThread().getContextClassLoader().getResources(packagePath);

            while (resources.hasMoreElements()) {
                java.net.URL resource = resources.nextElement();
                if (!"file".equals(resource.getProtocol())) {
                    continue;
                }

                Path basePath = Path.of(resource.toURI());
                if (!Files.exists(basePath)) {
                    continue;
                }

                try (Stream<Path> pathStream = Files.walk(basePath)) {
                    pathStream
                        .filter(path -> path.toString().endsWith(".class"))
                        .map(path -> loadClassFromPath(packageName, basePath, path))
                        .filter(java.util.Objects::nonNull)
                        .forEach(classes::add);
                }
            }
        } catch (IOException | URISyntaxException exception) {
            throw new IllegalStateException("Failed to scan package classes for " + packageName, exception);
        }

        return classes;
    }

    private static Class<?> loadClassFromPath(String packageName, Path basePath, Path classFilePath) {
        String relativePath = basePath.relativize(classFilePath).toString();
        String classNameSuffix = relativePath
            .replace('\\', '.')
            .replace('/', '.')
            .replaceAll("\\.class$", "");

        if (classNameSuffix.contains("$")) {
            return null;
        }

        try {
            return Class.forName(packageName + "." + classNameSuffix);
        } catch (ClassNotFoundException exception) {
            throw new IllegalStateException("Could not load class " + packageName + "." + classNameSuffix, exception);
        }
    }
}
