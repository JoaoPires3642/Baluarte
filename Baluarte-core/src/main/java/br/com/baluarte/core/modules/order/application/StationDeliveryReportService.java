package br.com.baluarte.core.modules.order.application;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StationDeliveryReportService {

    private static final DateTimeFormatter FILE_DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DISPLAY_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final CheckoutOrderRepository orderRepository;

    public StationDeliveryReportService(CheckoutOrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public StationDeliveryReportFile generateForDate(LocalDate deliveryDate) {
        List<CheckoutOrder> orders = orderRepository.findStationDeliveriesByDate(deliveryDate.format(FILE_DATE_FORMAT));
        byte[] content = buildPdf(orders, deliveryDate);
        return new StationDeliveryReportFile(
            "entregas-estacoes-" + deliveryDate.format(FILE_DATE_FORMAT) + ".pdf",
            content,
            "application/pdf",
            orders.size(),
            deliveryDate
        );
    }

    private byte[] buildPdf(List<CheckoutOrder> orders, LocalDate deliveryDate) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 50, 50);

        try {
            PdfWriter.getInstance(document, output);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            document.add(new Paragraph("Entregas em Estacoes", titleFont));
            document.add(new Paragraph("Data: " + deliveryDate.format(DISPLAY_DATE_FORMAT), subtitleFont));
            document.add(new Paragraph("Pedidos: " + orders.size(), subtitleFont));
            document.add(new Paragraph(" "));

            if (orders.isEmpty()) {
                document.add(new Paragraph("Nenhuma entrega em estacao para esta data.", subtitleFont));
            } else {
                for (CheckoutOrder order : orders) {
                    document.add(new Paragraph("Pedido " + orderReference(order), boldFont));
                    document.add(new Paragraph("Cliente: " + value(order.getRecipientName()), normalFont));
                    document.add(new Paragraph("Estacao: " + value(order.getDeliveryStation()), normalFont));
                    document.add(new Paragraph("Horario: " + value(order.getDeliveryTimeSlot()), normalFont));
                    document.add(new Paragraph("Itens: " + itemsSummary(order.getItems()), normalFont));
                    document.add(new Paragraph(" "));
                }
            }

            document.close();
        } catch (DocumentException e) {
            throw new IllegalStateException("Erro ao gerar PDF de entregas em estacoes", e);
        }

        return output.toByteArray();
    }

    private String orderReference(CheckoutOrder order) {
        return order.getOrderNumber() != null ? "BAL" + order.getOrderNumber() : order.getOrderId();
    }

    private String itemsSummary(List<CheckoutOrderItem> items) {
        if (items == null || items.isEmpty()) return "Sem itens";
        return items.stream()
            .map(item -> item.getQuantity() + "x " + value(item.getProductName()) + " (" + value(item.getSize()) + ")")
            .reduce((left, right) -> left + "; " + right)
            .orElse("Sem itens");
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
