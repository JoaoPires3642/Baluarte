package br.com.baluarte.core.modules.site.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SiteContactSettingsServiceTest {

    @Mock
    private SpringDataSiteContactSettingsJpaRepository repository;

    private SiteContactSettingsService service;

    @BeforeEach
    void setUp() {
        service = new SiteContactSettingsService(repository);
    }

    private SiteContactSettingsValues sampleValues() {
        return new SiteContactSettingsValues(
            "footer", "email@test.com", "11999999999", "11999999999",
            "9h-18h", "https://insta", "https://fb", "https://yt", "hi",
            new BigDecimal("299.00")
        );
    }

    @Test
    void get_returnsValuesFromExistingEntity() {
        SiteContactSettingsJpaEntity entity = new SiteContactSettingsJpaEntity();
        entity.apply(sampleValues());

        when(repository.findById(SiteContactSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.of(entity));

        SiteContactSettingsValues result = service.get();

        assertThat(result.footerMessage()).isEqualTo("footer");
        assertThat(result.email()).isEqualTo("email@test.com");
        assertThat(result.phone()).isEqualTo("11999999999");
        assertThat(result.whatsapp()).isEqualTo("11999999999");
        assertThat(result.businessHours()).isEqualTo("9h-18h");
        assertThat(result.instagramUrl()).isEqualTo("https://insta");
        assertThat(result.facebookUrl()).isEqualTo("https://fb");
        assertThat(result.youtubeUrl()).isEqualTo("https://yt");
        assertThat(result.whatsappMessage()).isEqualTo("hi");
        assertThat(result.freeShippingMinValue()).isEqualByComparingTo(new BigDecimal("299.00"));

        verify(repository).findById(SiteContactSettingsJpaEntity.SINGLETON_ID);
    }

    @Test
    void get_returnsDefaultValuesWhenNoEntity() {
        when(repository.findById(SiteContactSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.empty());

        SiteContactSettingsValues result = service.get();

        SiteContactSettingsValues defaults = SiteContactSettingsJpaEntity.defaults().toValues();
        assertThat(result).isEqualTo(defaults);

        verify(repository).findById(SiteContactSettingsJpaEntity.SINGLETON_ID);
    }

    @Test
    void save_updatesExistingEntity() {
        SiteContactSettingsJpaEntity existingEntity = org.mockito.Mockito.mock(SiteContactSettingsJpaEntity.class);
        SiteContactSettingsValues input = sampleValues();

        when(repository.findById(SiteContactSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.of(existingEntity));
        when(repository.save(existingEntity)).thenReturn(existingEntity);
        when(existingEntity.toValues()).thenReturn(input);

        SiteContactSettingsValues result = service.save(input);

        assertThat(result).isEqualTo(input);
        verify(existingEntity).apply(input);
        verify(repository).save(existingEntity);
    }

    @Test
    void save_createsDefaultsWhenNoEntityAndSaves() {
        SiteContactSettingsValues input = sampleValues();

        when(repository.findById(SiteContactSettingsJpaEntity.SINGLETON_ID))
            .thenReturn(Optional.empty());
        when(repository.save(any(SiteContactSettingsJpaEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        SiteContactSettingsValues result = service.save(input);

        assertThat(result.footerMessage()).isEqualTo("footer");
        assertThat(result.email()).isEqualTo("email@test.com");
        assertThat(result.phone()).isEqualTo("11999999999");
        assertThat(result.whatsapp()).isEqualTo("11999999999");
        assertThat(result.businessHours()).isEqualTo("9h-18h");
        assertThat(result.instagramUrl()).isEqualTo("https://insta");
        assertThat(result.facebookUrl()).isEqualTo("https://fb");
        assertThat(result.youtubeUrl()).isEqualTo("https://yt");
        assertThat(result.whatsappMessage()).isEqualTo("hi");
        assertThat(result.freeShippingMinValue()).isEqualByComparingTo(new BigDecimal("299.00"));

        verify(repository).findById(SiteContactSettingsJpaEntity.SINGLETON_ID);
        verify(repository).save(any(SiteContactSettingsJpaEntity.class));
    }
}
