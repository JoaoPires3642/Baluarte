package br.com.baluarte.core.modules.payment.infrastructure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderItem;
import br.com.baluarte.core.shared.pii.PiiCryptoService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class CheckoutOrderRepositoryAdapterTest {

    @Mock
    private SpringDataCheckoutOrderJpaRepository jpaRepository;

    @Mock
    private SpringDataCheckoutOrderItemJpaRepository itemRepository;

    @Mock
    private PiiCryptoService piiCrypto;

    private CheckoutOrderRepositoryAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new CheckoutOrderRepositoryAdapter(jpaRepository, itemRepository, piiCrypto);
    }

    @Test
    void findByIdReturnsOrderWhenFound() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "pending_payment");
        when(jpaRepository.findById("order-1")).thenReturn(Optional.of(entity));

        Optional<CheckoutOrder> result = adapter.findById("order-1");

        assertThat(result).isPresent();
        assertThat(result.get().getOrderId()).isEqualTo("order-1");
        assertThat(result.get().getStatus()).isEqualTo("pending_payment");
    }

    @Test
    void findByIdReturnsEmptyWhenNotFound() {
        when(jpaRepository.findById("unknown")).thenReturn(Optional.empty());

        Optional<CheckoutOrder> result = adapter.findById("unknown");

        assertThat(result).isEmpty();
    }

    @Test
    void findByCheckoutSessionIdReturnsOrderWhenFound() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "paid");
        when(jpaRepository.findByCheckoutSessionId("session-1")).thenReturn(Optional.of(entity));

        Optional<CheckoutOrder> result = adapter.findByCheckoutSessionId("session-1");

        assertThat(result).isPresent();
        assertThat(result.get().getCheckoutSessionId()).isEqualTo("session-1");
    }

    @Test
    void findByShippingLabelIdReturnsOrderWhenFound() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "paid");
        when(jpaRepository.findByShippingLabelId("label-1")).thenReturn(Optional.of(entity));

        Optional<CheckoutOrder> result = adapter.findByShippingLabelId("label-1");

        assertThat(result).isPresent();
        assertThat(result.get().getOrderId()).isEqualTo("order-1");
    }

    @Test
    void findAllWithoutPaginationReturnsAllOrders() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "paid");
        when(jpaRepository.findAll()).thenReturn(List.of(entity));

        List<CheckoutOrder> result = adapter.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getOrderId()).isEqualTo("order-1");
    }

    @Test
    void findAllWithPaginationReturnsOrders() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "pending_payment");
        Page<CheckoutOrderJpaEntity> page = org.mockito.Mockito.mock(Page.class);
        when(page.getContent()).thenReturn(List.of(entity));
        when(jpaRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(page);
        when(itemRepository.findByOrderIdIn(anyList())).thenReturn(List.of());

        List<CheckoutOrder> result = adapter.findAll(0, 10);

        assertThat(result).hasSize(1);
    }

    @Test
    void findByStatusInReturnsFilteredOrders() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "paid");
        when(jpaRepository.findByStatusInOrderByCreatedAtAsc(List.of("paid", "processing")))
            .thenReturn(List.of(entity));

        List<CheckoutOrder> result = adapter.findByStatusIn(List.of("paid", "processing"));

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo("paid");
    }

    @Test
    void findStationDeliveriesByDateReturnsOrders() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "paid");
        entity.getItems().add(new CheckoutOrderItemJpaEntity());
        when(jpaRepository.findByShippingTypeAndDeliveryDateOrderByDeliveryStationAscDeliveryTimeSlotAsc(
            "station", "2026-06-18")).thenReturn(List.of(entity));

        List<CheckoutOrder> result = adapter.findStationDeliveriesByDate("2026-06-18");

        assertThat(result).hasSize(1);
    }

    @Test
    void findSeparationReportByCreatedDateReturnsCombinedOrders() {
        LocalDate date = LocalDate.of(2026, 6, 17);
        CheckoutOrderJpaEntity regularEntity = jpaEntity("order-1", "paid");
        CheckoutOrderJpaEntity stationEntity = jpaEntity("order-2", "paid");

        when(jpaRepository.findNonStationSeparationOrders(anyList(), any(), any()))
            .thenReturn(List.of(regularEntity));
        when(jpaRepository.findByShippingTypeAndDeliveryDateOrderByDeliveryStationAscDeliveryTimeSlotAsc(
            "station", "2026-06-18")).thenReturn(List.of(stationEntity));

        List<CheckoutOrder> result = adapter.findSeparationReportByCreatedDate(date);

        assertThat(result).hasSize(2);
    }

    @Test
    void countAllReturnsTotalCount() {
        when(jpaRepository.count()).thenReturn(42L);

        long count = adapter.countAll();

        assertThat(count).isEqualTo(42L);
    }

    @Test
    void findPendingPaymentCreatedBeforeReturnsOrders() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "pending_payment");
        Instant cutoff = Instant.now();
        when(jpaRepository.findByStatusAndCreatedAtBeforeOrderByCreatedAtAsc(
            anyString(), any(), any(Pageable.class))).thenReturn(List.of(entity));

        List<CheckoutOrder> result = adapter.findPendingPaymentCreatedBefore(cutoff, 50);

        assertThat(result).hasSize(1);
    }

    @Test
    void findByCustomerRefReturnsOrders() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "paid");
        when(jpaRepository.findByCustomerRef("cust-1")).thenReturn(List.of(entity));

        List<CheckoutOrder> result = adapter.findByCustomerRef("cust-1");

        assertThat(result).hasSize(1);
    }

    @Test
    void findByUserIdReturnsOrders() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "paid");
        when(jpaRepository.findByUserIdOrderByCreatedAtDesc("user-1")).thenReturn(List.of(entity));

        List<CheckoutOrder> result = adapter.findByUserId("user-1");

        assertThat(result).hasSize(1);
    }

    @Test
    void findByIdAndUserIdReturnsOrderWhenFound() {
        CheckoutOrderJpaEntity entity = jpaEntity("order-1", "paid");
        when(jpaRepository.findByOrderIdAndUserId("order-1", "user-1")).thenReturn(Optional.of(entity));

        Optional<CheckoutOrder> result = adapter.findByIdAndUserId("order-1", "user-1");

        assertThat(result).isPresent();
        assertThat(result.get().getOrderId()).isEqualTo("order-1");
    }

    @Test
    void saveNewOrderWithoutItems() {
        CheckoutOrder domainOrder = createDomainOrder("order-new", "pending_payment", null);
        CheckoutOrderJpaEntity entity = jpaEntity("order-new", "pending_payment");

        when(jpaRepository.existsById("order-new")).thenReturn(false);
        when(jpaRepository.findById("order-new")).thenReturn(Optional.empty());
        when(jpaRepository.nextOrderNumber()).thenReturn(500L);
        when(jpaRepository.save(any(CheckoutOrderJpaEntity.class))).thenReturn(entity);

        CheckoutOrder result = adapter.save(domainOrder);

        assertThat(result.getOrderId()).isEqualTo("order-new");
    }

    @Test
    void saveNewOrderWithItems() {
        CheckoutOrderItem item = new CheckoutOrderItem("item-1", "order-new",
            UUID.randomUUID().toString(), "Camisa", "M", 2, BigDecimal.TEN);
        CheckoutOrder domainOrder = createDomainOrder("order-new", "pending_payment", List.of(item));
        CheckoutOrderJpaEntity entity = jpaEntity("order-new", "pending_payment");

        when(jpaRepository.existsById("order-new")).thenReturn(false);
        when(jpaRepository.findById("order-new")).thenReturn(Optional.empty());
        when(jpaRepository.nextOrderNumber()).thenReturn(501L);
        when(jpaRepository.save(any(CheckoutOrderJpaEntity.class))).thenReturn(entity);
        when(itemRepository.findByOrderId("order-new")).thenReturn(List.of());
        when(itemRepository.saveAll(anyList())).thenReturn(List.of());

        CheckoutOrder result = adapter.save(domainOrder);

        assertThat(result.getOrderId()).isEqualTo("order-new");
        verify(itemRepository).deleteAll(anyList());
        verify(itemRepository).saveAll(anyList());
    }

    @Test
    void saveExistingOrder() {
        CheckoutOrder domainOrder = createDomainOrder("order-exists", "paid", null);
        CheckoutOrderJpaEntity existingEntity = jpaEntity("order-exists", "pending_payment");
        CheckoutOrderJpaEntity savedEntity = jpaEntity("order-exists", "paid");

        when(jpaRepository.existsById("order-exists")).thenReturn(true);
        when(jpaRepository.findById("order-exists")).thenReturn(Optional.of(existingEntity));
        when(jpaRepository.save(any(CheckoutOrderJpaEntity.class))).thenReturn(savedEntity);

        CheckoutOrder result = adapter.save(domainOrder);

        assertThat(result.getOrderId()).isEqualTo("order-exists");
    }

    private CheckoutOrderJpaEntity jpaEntity(String orderId, String status) {
        CheckoutOrder domain = createDomainOrder(orderId, status, null);
        CheckoutOrderJpaEntity entity = CheckoutOrderJpaEntity.create(domain);
        entity.setOrderNumber(100L);
        return entity;
    }

    private CheckoutOrder createDomainOrder(String orderId, String status, List<CheckoutOrderItem> items) {
        CheckoutOrder order = new CheckoutOrder(
            orderId, "session-1", "cust-ref-1", "user-1",
            "test@test.com", "CPF", "12345678909", "John",
            status, BigDecimal.valueOf(100), BigDecimal.TEN,
            "01001000", "Rua A", "100", null, "Centro", "SP", "SP"
        );
        if (items != null) {
            order.setItems(items);
        }
        return order;
    }
}
