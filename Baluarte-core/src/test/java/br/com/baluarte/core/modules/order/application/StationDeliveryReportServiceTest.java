package br.com.baluarte.core.modules.order.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StationDeliveryReportServiceTest {

    @Mock
    private CheckoutOrderRepository orderRepository;

    private StationDeliveryReportService service;

    @BeforeEach
    void setUp() {
        service = new StationDeliveryReportService(orderRepository);
    }

    @Test
    void generatesPdfReportWithOrders() {
        LocalDate date = LocalDate.of(2026, 6, 17);
        String formatted = "2026-06-17";
        CheckoutOrder order = orderWithStationDelivery("station-1", "B1", "08:00-12:00");
        when(orderRepository.findStationDeliveriesByDate(formatted)).thenReturn(List.of(order));

        StationDeliveryReportFile report = service.generateForDate(date);

        assertThat(report.filename()).isEqualTo("entregas-estacoes-" + formatted + ".pdf");
        assertThat(report.contentType()).isEqualTo("application/pdf");
        assertThat(report.content()).isNotEmpty();
        assertThat(report.ordersCount()).isEqualTo(1);
        assertThat(report.deliveryDate()).isEqualTo(date);
    }

    @Test
    void generatesPdfReportWithNoOrders() {
        LocalDate date = LocalDate.of(2026, 6, 17);
        when(orderRepository.findStationDeliveriesByDate("2026-06-17")).thenReturn(List.of());

        StationDeliveryReportFile report = service.generateForDate(date);

        assertThat(report.filename()).isEqualTo("entregas-estacoes-2026-06-17.pdf");
        assertThat(report.contentType()).isEqualTo("application/pdf");
        assertThat(report.content()).isNotEmpty();
        assertThat(report.ordersCount()).isEqualTo(0);
    }

    @Test
    void generatesPdfWithMultipleOrders() {
        LocalDate date = LocalDate.of(2026, 6, 17);
        CheckoutOrder o1 = orderWithStationDelivery("s1", "A1", "08:00-10:00");
        CheckoutOrder o2 = orderWithStationDelivery("s2", "B2", "14:00-16:00");
        o2.setItems(List.of());
        when(orderRepository.findStationDeliveriesByDate("2026-06-17")).thenReturn(List.of(o1, o2));

        StationDeliveryReportFile report = service.generateForDate(date);

        assertThat(report.ordersCount()).isEqualTo(2);
        assertThat(report.content()).isNotEmpty();
    }

    private CheckoutOrder orderWithStationDelivery(String orderId, String station, String timeSlot) {
        CheckoutOrder order = new CheckoutOrder(
            orderId, "session-1", "cust-1", "user-1",
            "test@test.com", "CPF", "12345678909", "Recipient",
            "paid", BigDecimal.valueOf(100), BigDecimal.ZERO,
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP"
        );
        order.setOrderNumber(1001L);
        order.setDeliveryStation(station);
        order.setDeliveryTimeSlot(timeSlot);
        order.setDeliveryDate("2026-06-17");
        order.setItems(List.of(
            new CheckoutOrderItem("i1", orderId, "p1", "Camisa", "M", 2, BigDecimal.TEN)
        ));
        return order;
    }
}
