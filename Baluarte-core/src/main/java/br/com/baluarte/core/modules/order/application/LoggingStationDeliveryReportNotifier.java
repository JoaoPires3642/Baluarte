package br.com.baluarte.core.modules.order.application;

import java.util.Base64;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class LoggingStationDeliveryReportNotifier implements StationDeliveryReportNotifier {

    private static final Logger logger = LoggerFactory.getLogger(LoggingStationDeliveryReportNotifier.class);

    private final String webhookUrl;
    private final String webhookSecret;
    private final RestClient restClient;

    public LoggingStationDeliveryReportNotifier(
        @Value("${app.station-delivery.report.webhook-url:}") String webhookUrl,
        @Value("${app.station-delivery.report.webhook-secret:}") String webhookSecret
    ) {
        this.webhookUrl = webhookUrl;
        this.webhookSecret = webhookSecret;
        this.restClient = RestClient.create();
    }

    @Override
    public void send(String recipientPhone, StationDeliveryReportFile reportFile) {
        if (webhookUrl != null && !webhookUrl.isBlank()) {
            sendToWebhook(recipientPhone, reportFile);
            return;
        }

        logger.info(
            "station_delivery_report.ready recipient={} filename={} contentType={} bytes={} orders={} deliveryDate={}",
            recipientPhone,
            reportFile.filename(),
            reportFile.contentType(),
            reportFile.content().length,
            reportFile.ordersCount(),
            reportFile.deliveryDate()
        );
    }

    private void sendToWebhook(String recipientPhone, StationDeliveryReportFile reportFile) {
        Map<String, Object> payload = Map.of(
            "recipientPhone", recipientPhone,
            "filename", reportFile.filename(),
            "contentType", reportFile.contentType(),
            "contentBase64", Base64.getEncoder().encodeToString(reportFile.content()),
            "ordersCount", reportFile.ordersCount(),
            "deliveryDate", reportFile.deliveryDate().toString()
        );

        RestClient.RequestBodySpec request = restClient.post()
            .uri(webhookUrl)
            .header(HttpHeaders.CONTENT_TYPE, "application/json");
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            request.header("X-Baluarte-Webhook-Secret", webhookSecret);
        }
        request.body(payload).retrieve().toBodilessEntity();

        logger.info(
            "station_delivery_report.sent webhook={} recipient={} filename={} orders={} deliveryDate={}",
            webhookUrl,
            recipientPhone,
            reportFile.filename(),
            reportFile.ordersCount(),
            reportFile.deliveryDate()
        );
    }
}
