package br.com.baluarte.core.modules.order.application;

import java.time.LocalDate;

public record StationDeliveryReportFile(
    String filename,
    byte[] content,
    String contentType,
    int ordersCount,
    LocalDate deliveryDate
) {
}
