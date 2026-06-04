package br.com.baluarte.core.modules.order.application;

import br.com.baluarte.core.modules.checkout.infrastructure.AdminShippingSettingsService;
import br.com.baluarte.core.modules.checkout.infrastructure.AdminShippingSettingsValues;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AutomaticShippingLabelJob {

    private static final Logger logger = LoggerFactory.getLogger(AutomaticShippingLabelJob.class);
    private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");

    private final AdminShippingSettingsService settingsService;
    private final ShippingLabelGenerationService shippingLabelGenerationService;
    private LocalDate lastRunDate;

    public AutomaticShippingLabelJob(
        AdminShippingSettingsService settingsService,
        ShippingLabelGenerationService shippingLabelGenerationService
    ) {
        this.settingsService = settingsService;
        this.shippingLabelGenerationService = shippingLabelGenerationService;
    }

    @Scheduled(fixedDelayString = "${app.shipping.automatic-label-check-delay-ms:60000}")
    public void runIfConfigured() {
        AdminShippingSettingsValues settings = settingsService.get();
        if (settings.automaticLabelEnabled() == null || !settings.automaticLabelEnabled()) {
            return;
        }

        LocalDateTime now = LocalDateTime.now(ZONE_ID);
        LocalTime runTime = parseTime(settings.automaticLabelRunTime(), LocalTime.of(17, 0));
        if (lastRunDate != null && lastRunDate.equals(now.toLocalDate())) {
            return;
        }
        if (now.toLocalTime().isBefore(runTime)) {
            return;
        }

        LocalTime cutoffTime = parseTime(settings.automaticLabelCutoffTime(), LocalTime.of(15, 0));
        LocalDateTime cutoff = LocalDateTime.of(now.toLocalDate(), cutoffTime);
        BulkShippingLabelGenerationResult result = shippingLabelGenerationService.generatePending(cutoff.atZone(ZONE_ID).toInstant());
        lastRunDate = now.toLocalDate();
        logger.info(
            "shipping.automation event=automatic_labels_generated candidates={} generated={} failures={}",
            result.candidates(),
            result.generated(),
            result.failures().size()
        );
    }

    private LocalTime parseTime(String value, LocalTime fallback) {
        try {
            return value == null || value.isBlank() ? fallback : LocalTime.parse(value);
        } catch (Exception exception) {
            return fallback;
        }
    }
}
