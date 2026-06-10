package br.com.baluarte.core.modules.order.application;

import br.com.baluarte.core.modules.site.infrastructure.SiteContactSettingsService;
import br.com.baluarte.core.modules.site.infrastructure.SiteContactSettingsValues;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AutomaticStationDeliveryReportJob {

    private static final Logger logger = LoggerFactory.getLogger(AutomaticStationDeliveryReportJob.class);
    private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");

    private final boolean enabled;
    private final String runTime;
    private final SiteContactSettingsService contactSettingsService;
    private final StationDeliveryReportService reportService;
    private final StationDeliveryReportNotifier notifier;
    private LocalDate lastRunDate;

    public AutomaticStationDeliveryReportJob(
        @Value("${app.station-delivery.report.enabled:true}") boolean enabled,
        @Value("${app.station-delivery.report.run-time:18:00}") String runTime,
        SiteContactSettingsService contactSettingsService,
        StationDeliveryReportService reportService,
        StationDeliveryReportNotifier notifier
    ) {
        this.enabled = enabled;
        this.runTime = runTime;
        this.contactSettingsService = contactSettingsService;
        this.reportService = reportService;
        this.notifier = notifier;
    }

    @Scheduled(fixedDelayString = "${app.station-delivery.report.check-delay-ms:60000}")
    public void runIfConfigured() {
        if (!enabled) return;

        LocalDateTime now = LocalDateTime.now(ZONE_ID);
        if (lastRunDate != null && lastRunDate.equals(now.toLocalDate())) return;
        if (now.toLocalTime().isBefore(parseTime(runTime, LocalTime.of(18, 0)))) return;

        SiteContactSettingsValues contact = contactSettingsService.get();
        String recipient = firstFilled(contact.whatsapp(), contact.phone());
        if (recipient == null) {
            logger.warn("station_delivery_report.skipped reason=no_recipient_contact");
            lastRunDate = now.toLocalDate();
            return;
        }

        LocalDate deliveryDate = now.toLocalDate().plusDays(1);
        StationDeliveryReportFile reportFile = reportService.generateForDate(deliveryDate);
        if (reportFile.ordersCount() == 0) {
            logger.info("station_delivery_report.skipped reason=no_station_orders deliveryDate={}", deliveryDate);
            lastRunDate = now.toLocalDate();
            return;
        }

        notifier.send(recipient, reportFile);
        lastRunDate = now.toLocalDate();
    }

    private String firstFilled(String first, String second) {
        if (first != null && !first.isBlank()) return first;
        if (second != null && !second.isBlank()) return second;
        return null;
    }

    private LocalTime parseTime(String value, LocalTime fallback) {
        try {
            return value == null || value.isBlank() ? fallback : LocalTime.parse(value);
        } catch (Exception exception) {
            return fallback;
        }
    }
}
