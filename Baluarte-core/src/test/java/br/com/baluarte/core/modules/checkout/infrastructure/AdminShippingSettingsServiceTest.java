package br.com.baluarte.core.modules.checkout.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminShippingSettingsServiceTest {

    @Mock
    private SpringDataAdminShippingSettingsJpaRepository repository;

    @Mock
    private AdminShippingSettingsProperties properties;

    @Captor
    private ArgumentCaptor<AdminShippingSettingsJpaEntity> entityCaptor;

    private AdminShippingSettingsService service;

    @BeforeEach
    void setUp() {
        service = new AdminShippingSettingsService(repository, properties);
    }

    @Test
    void get_returnsFromRepositoryWhenFound() {
        AdminShippingSettingsJpaEntity entity = new AdminShippingSettingsJpaEntity();
        entity.apply(createValues("sf-token"));
        when(repository.findById(AdminShippingSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.of(entity));

        AdminShippingSettingsValues result = service.get();

        assertThat(result.provider()).isEqualTo("superfrete");
    }

    @Test
    void get_returnsDefaultsWhenNotFound() {
        AdminShippingSettingsValues defaults = createValues("prop-token");
        when(repository.findById(AdminShippingSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.empty());
        when(properties.toValues()).thenReturn(defaults);

        AdminShippingSettingsValues result = service.get();

        assertThat(result.superfreteToken()).isEqualTo("prop-token");
    }

    @Test
    void save_usesProvidedToken() {
        AdminShippingSettingsJpaEntity existing = new AdminShippingSettingsJpaEntity();
        existing.apply(createValues("old-token"));
        AdminShippingSettingsValues input = createValues("new-token");

        when(repository.findById(AdminShippingSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.of(existing));
        when(repository.save(entityCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        AdminShippingSettingsValues result = service.save(input);

        assertThat(result.superfreteToken()).isEqualTo("new-token");
    }

    @Test
    void save_createsNewEntityWhenNotFound() {
        AdminShippingSettingsValues defaults = createValues("default-token");
        AdminShippingSettingsValues input = createValues("input-token");
        when(properties.toValues()).thenReturn(defaults);
        when(repository.findById(AdminShippingSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.empty());
        when(repository.save(entityCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        AdminShippingSettingsValues result = service.save(input);

        assertThat(result.superfreteToken()).isEqualTo("input-token");
        AdminShippingSettingsJpaEntity captured = entityCaptor.getValue();
        assertThat(captured.getSettingsId()).isEqualTo(AdminShippingSettingsJpaEntity.SINGLETON_ID);
    }

    @Test
    void save_keepsExistingTokenWhenNewTokenIsBlank() {
        AdminShippingSettingsJpaEntity existing = new AdminShippingSettingsJpaEntity();
        existing.apply(createValues("existing-token"));
        AdminShippingSettingsValues input = createValues("");

        when(repository.findById(AdminShippingSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.of(existing));
        when(repository.save(entityCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        AdminShippingSettingsValues result = service.save(input);

        assertThat(result.superfreteToken()).isEqualTo("existing-token");
    }

    @Test
    void save_fallsBackToPropertiesTokenWhenBothBlank() {
        AdminShippingSettingsJpaEntity existing = new AdminShippingSettingsJpaEntity();
        existing.apply(createValues(""));
        AdminShippingSettingsValues input = createValues("");
        AdminShippingSettingsValues propsWithToken = createValues("properties-token");
        when(properties.toValues()).thenReturn(propsWithToken);

        when(repository.findById(AdminShippingSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.of(existing));
        when(repository.save(entityCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        AdminShippingSettingsValues result = service.save(input);

        assertThat(result.superfreteToken()).isEqualTo("properties-token");
    }

    private AdminShippingSettingsValues createValues(String token) {
        return new AdminShippingSettingsValues(
            "superfrete", "01153000", BigDecimal.valueOf(0.3), 4, 25, 35,
            "https://sandbox.superfrete.com", token, "1,2,17",
            "Baluarte/1.0", "/api/v0/cart", "/api/v0/checkout", "/api/v0/tag/print",
            "Loja", "11999999999", "loja@test.com", "12345678909",
            "Rua X", "100", "", "Centro", "Sao Paulo", "SP",
            List.of(new AdminShippingPackageOption("Padrao", 999, 4, 25, 35)),
            false, "17:00", "15:00"
        );
    }
}
