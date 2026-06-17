package br.com.baluarte.core.modules.payment.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.adminproduct.infrastructure.AdminProductJpaEntity;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductJpaRepository;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.api.CreatePaymentRequest;
import br.com.baluarte.core.modules.payment.api.CreatePaymentResponse;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.modules.payment.domain.PaymentTransaction;
import br.com.baluarte.core.modules.payment.domain.PaymentTransactionRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CreatePaymentUseCaseTest {

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private CheckoutOrderRepository orderRepository;

    @Mock
    private PaymentTransactionRepository transactionRepository;

    @Mock
    private SpringDataAdminProductJpaRepository productRepository;

    @Mock
    private SpringDataAdminProductVariantJpaRepository variantRepository;

    private CreatePaymentUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new CreatePaymentUseCase(paymentGateway, orderRepository,
            transactionRepository, productRepository, variantRepository);
    }

    @Test
    void rejectsInvalidCpf() {
        CreatePaymentRequest request = validRequest("credit_card",
            new CreatePaymentRequest.Identification("CPF", "00000000000"),
            new CreatePaymentRequest.Card("token-123", "visa", null, 1));

        assertThatThrownBy(() -> useCase.execute(request, "mock", "user-1"))
            .isInstanceOf(PaymentValidationException.class)
            .hasMessage("CPF invalido");
    }

    @Test
    void rejectsInvalidProductId() {
        var items = List.of(new CreatePaymentRequest.Item("not-a-uuid", "M", 1, null, null, null));
        CreatePaymentRequest request = new CreatePaymentRequest(
            "session-1", "idem-123", "credit_card",
            new CreatePaymentRequest.Payer("test@test.com",
                new CreatePaymentRequest.Identification("CPF", "12345678909")),
            new CreatePaymentRequest.ShippingAddress("John", "01001000", "Rua A", "100", null, "Centro", "SP", "SP"),
            new CreatePaymentRequest.ShippingSelection("opt-1", "Correios", BigDecimal.TEN),
            items,
            new CreatePaymentRequest.Card("token-123", "visa", null, 1),
            "delivery", null, null, null, null
        );

        assertThatThrownBy(() -> useCase.execute(request, "mock", "user-1"))
            .isInstanceOf(PaymentValidationException.class)
            .hasMessage("Produto invalido");
    }

    @Test
    void rejectsUnavailableProduct() {
        UUID productId = UUID.randomUUID();
        CreatePaymentRequest request = requestWithItem("credit_card", productId, "M",
            new CreatePaymentRequest.Card("token-123", "visa", null, 1));

        AdminProductJpaEntity product = productMock(productId, "Camisa", true, false);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> useCase.execute(request, "mock", "user-1"))
            .isInstanceOf(PaymentValidationException.class)
            .hasMessage("Produto indisponivel");
    }

    @Test
    void rejectsInsufficientStock() {
        UUID productId = UUID.randomUUID();
        CreatePaymentRequest request = requestWithItem("credit_card", productId, "M",
            new CreatePaymentRequest.Card("token-123", "visa", null, 1));

        AdminProductJpaEntity product = productMock(productId, "Camisa", true, true);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(variantRepository.reserveStock(productId, "M", 1)).thenReturn(0);

        assertThatThrownBy(() -> useCase.execute(request, "mock", "user-1"))
            .isInstanceOf(PaymentValidationException.class)
            .hasMessageContaining("Estoque insuficiente");
    }

    @Test
    void returnsExistingTransactionOnIdempotencyMatch() {
        UUID productId = UUID.randomUUID();
        CreatePaymentRequest request = requestWithItem("credit_card", productId, "M",
            new CreatePaymentRequest.Card("token-123", "visa", null, 1));

        PaymentTransaction existing = new PaymentTransaction("pay-1", "order-1", "mock",
            "credit_card", BigDecimal.valueOf(100), "approved", "idem-123");
        CheckoutOrder existingOrder = new CheckoutOrder();
        existingOrder.setOrderNumber(1001L);

        when(transactionRepository.findByIdempotencyKey("idem-123")).thenReturn(Optional.of(existing));
        when(orderRepository.findById("order-1")).thenReturn(Optional.of(existingOrder));

        CreatePaymentResponse response = useCase.execute(request, "mock", "user-1");

        assertThat(response.paymentId()).isEqualTo("pay-1");
        assertThat(response.orderReference()).isEqualTo("BAL1001");
    }

    @Test
    void createsPaymentWithApprovedCard() {
        UUID productId = UUID.randomUUID();
        CreatePaymentRequest request = requestWithItem("credit_card", productId, "M",
            new CreatePaymentRequest.Card("token-valid", "visa", null, 1));

        AdminProductJpaEntity product = productMock(productId, "Camisa", true, true);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(variantRepository.reserveStock(productId, "M", 1)).thenReturn(1);
        when(transactionRepository.findByIdempotencyKey("idem-123")).thenReturn(Optional.empty());
        when(orderRepository.save(any(CheckoutOrder.class))).thenAnswer(invocation -> {
            CheckoutOrder o = invocation.getArgument(0);
            o.setOrderNumber(1002L);
            return o;
        });
        when(paymentGateway.create(any(CreatePaymentCommand.class)))
            .thenReturn(PaymentGatewayResult.approvedCard("prov-pay-1", "approved", "accredited", 1));

        CreatePaymentResponse response = useCase.execute(request, "mock", "user-1");

        assertThat(response.status()).isEqualTo("approved");
        assertThat(response.method()).isEqualTo("credit_card");
        assertThat(response.orderReference()).isEqualTo("BAL1002");
        verify(variantRepository, never()).releaseStock(any(), anyString(), anyInt());
    }

    @Test
    void createsPaymentWithPix() {
        UUID productId = UUID.randomUUID();
        CreatePaymentRequest request = requestWithItem("pix", productId, "G", null);

        AdminProductJpaEntity product = productMock(productId, "Camisa", true, true);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(variantRepository.reserveStock(productId, "G", 1)).thenReturn(1);
        when(transactionRepository.findByIdempotencyKey("idem-123")).thenReturn(Optional.empty());
        when(orderRepository.save(any(CheckoutOrder.class))).thenAnswer(invocation -> {
            CheckoutOrder o = invocation.getArgument(0);
            o.setOrderNumber(1003L);
            return o;
        });
        when(paymentGateway.create(any(CreatePaymentCommand.class)))
            .thenReturn(PaymentGatewayResult.pendingPix("prov-pay-1", "pending",
                "pending_waiting_transfer", "qr-code", "base64", "copy-paste"));

        CreatePaymentResponse response = useCase.execute(request, "mock", "user-1");

        assertThat(response.status()).isEqualTo("pending");
        assertThat(response.method()).isEqualTo("pix");
        assertThat(response.pix()).isNotNull();
        assertThat(response.pix().qrCode()).isEqualTo("qr-code");
    }

    @Test
    void releasesStockWhenPaymentRejected() {
        UUID productId = UUID.randomUUID();
        CreatePaymentRequest request = requestWithItem("credit_card", productId, "M",
            new CreatePaymentRequest.Card("token-reject", "visa", null, 1));

        AdminProductJpaEntity product = productMock(productId, "Camisa", true, true);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(variantRepository.reserveStock(productId, "M", 1)).thenReturn(1);
        when(transactionRepository.findByIdempotencyKey("idem-123")).thenReturn(Optional.empty());
        when(orderRepository.save(any(CheckoutOrder.class))).thenAnswer(invocation -> {
            CheckoutOrder o = invocation.getArgument(0);
            o.setOrderNumber(1004L);
            return o;
        });
        when(paymentGateway.create(any(CreatePaymentCommand.class)))
            .thenReturn(PaymentGatewayResult.rejectedCard("prov-pay-1", "rejected",
                "cc_rejected_bad_filled_card_number", 1));

        useCase.execute(request, "mock", "user-1");

        verify(variantRepository).releaseStock(productId, "M", 1);
    }

    @Test
    void skipsNonCpfValidation() {
        UUID productId = UUID.randomUUID();
        var items = List.of(new CreatePaymentRequest.Item(productId.toString(), "M", 1, null, null, null));
        CreatePaymentRequest request = new CreatePaymentRequest(
            "session-1", "idem-123", "credit_card",
            new CreatePaymentRequest.Payer("test@test.com",
                new CreatePaymentRequest.Identification("OTHER", "12345")),
            new CreatePaymentRequest.ShippingAddress("John", "01001000", "Rua A", "100", null, "Centro", "SP", "SP"),
            new CreatePaymentRequest.ShippingSelection("opt-1", "Correios", BigDecimal.TEN),
            items,
            new CreatePaymentRequest.Card("token-valid", "visa", null, 1),
            "delivery", null, null, null, null
        );

        AdminProductJpaEntity product = productMock(productId, "Camisa", true, true);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(variantRepository.reserveStock(productId, "M", 1)).thenReturn(1);
        when(transactionRepository.findByIdempotencyKey("idem-123")).thenReturn(Optional.empty());
        when(orderRepository.save(any(CheckoutOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentGateway.create(any(CreatePaymentCommand.class)))
            .thenReturn(PaymentGatewayResult.approvedCard("prov-pay-1", "approved", "accredited", 1));

        CreatePaymentResponse response = useCase.execute(request, "mock", "user-1");

        assertThat(response.status()).isEqualTo("approved");
    }

    private CreatePaymentRequest validRequest(String method,
            CreatePaymentRequest.Identification identification,
            CreatePaymentRequest.Card card) {
        UUID productId = UUID.randomUUID();
        return requestWithItem(method, productId, "M", card, identification);
    }

    private CreatePaymentRequest requestWithItem(String method, UUID productId, String size,
            CreatePaymentRequest.Card card) {
        return requestWithItem(method, productId, size, card,
            new CreatePaymentRequest.Identification("CPF", "12345678909"));
    }

    private CreatePaymentRequest requestWithItem(String method, UUID productId, String size,
            CreatePaymentRequest.Card card, CreatePaymentRequest.Identification identification) {
        var items = List.of(new CreatePaymentRequest.Item(productId.toString(), size, 1, null, null, null));
        return new CreatePaymentRequest(
            "session-1", "idem-123", method,
            new CreatePaymentRequest.Payer("test@test.com", identification),
            new CreatePaymentRequest.ShippingAddress("John", "01001000", "Rua A", "100", null, "Centro", "SP", "SP"),
            new CreatePaymentRequest.ShippingSelection("opt-1", "Correios", BigDecimal.TEN),
            items, card, "delivery", null, null, null, null
        );
    }

    private AdminProductJpaEntity productMock(UUID id, String name, Boolean active, Boolean available) {
        AdminProductJpaEntity product = org.mockito.Mockito.mock(AdminProductJpaEntity.class);
        lenient().when(product.getId()).thenReturn(id);
        lenient().when(product.getModelName()).thenReturn(name);
        lenient().when(product.getActive()).thenReturn(active);
        lenient().when(product.getAvailable()).thenReturn(available);
        lenient().when(product.getPrice()).thenReturn(BigDecimal.valueOf(100));
        return product;
    }
}
