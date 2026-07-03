package br.com.baluarte.core.modules.order.application;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
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
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                PdfCursor cursor = new PdfCursor(50, 790);
                writeLine(content, cursor, "Entregas em Estacoes", 18, true);
                writeLine(content, cursor, "Data: " + deliveryDate.format(DISPLAY_DATE_FORMAT), 11, false);
                writeLine(content, cursor, "Pedidos: " + orders.size(), 11, false);
                cursor.move(12);

                if (orders.isEmpty()) {
                    writeLine(content, cursor, "Nenhuma entrega em estacao para esta data.", 12, false);
                } else {
                    for (CheckoutOrder order : orders) {
                        writeLine(content, cursor, "Pedido " + orderReference(order), 13, true);
                        writeLine(content, cursor, "Cliente: " + value(order.getRecipientName()), 10, false);
                        writeLine(content, cursor, "Estacao: " + value(order.getDeliveryStation()), 10, false);
                        writeLine(content, cursor, "Horario: " + value(order.getDeliveryTimeSlot()), 10, false);
                        writeLine(content, cursor, "Itens: " + itemsSummary(order.getItems()), 10, false);
                        cursor.move(10);
                    }
                }
            }

            document.save(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Erro ao gerar PDF de entregas em estacoes", exception);
        }
    }

    private void writeLine(PDPageContentStream content, PdfCursor cursor, String text, int fontSize, boolean bold) throws IOException {
        content.beginText();
        content.setFont(new PDType1Font(bold ? Standard14Fonts.FontName.HELVETICA_BOLD : Standard14Fonts.FontName.HELVETICA), fontSize);
        content.newLineAtOffset(cursor.x(), cursor.y());
        content.showText(safeText(text));
        content.endText();
        cursor.move(fontSize + 7);
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

    private String safeText(String text) {
        return text.replace("\n", " ").replace("\r", " ");
    }

    private static class PdfCursor {
        private final float x;
        private float y;

        PdfCursor(float x, float y) {
            this.x = x;
            this.y = y;
        }

        float x() { return x; }
        float y() { return y; }
        void move(float amount) { y -= amount; }
    }
}
