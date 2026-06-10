package br.com.baluarte.core.modules.order.application;

public interface StationDeliveryReportNotifier {
    void send(String recipientPhone, StationDeliveryReportFile reportFile);
}
