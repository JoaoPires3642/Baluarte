# Story 4.1 Payment Gateway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Story 4.1 end-to-end with Pix QR/copia-e-cola, in-app card payment with installments, mock + Mercado Pago gateway strategies, idempotent payment creation, and backend order/payment linkage.

**Architecture:** The backend gets a new `payment` module following the existing `api/application/domain/infrastructure` pattern, plus Flyway persistence for lightweight order + payment records. The frontend keeps the current `CheckoutScreen` flow but splits payment UI into focused Pix/card components, adds payment API contracts, and isolates card token generation behind a provider abstraction so Expo Go can use a deterministic test bypass while the Mercado Pago adapter is wired by environment for supported runtimes.

**Tech Stack:** Spring Boot 3.5 + JPA + Flyway + H2/PostgreSQL, React Native + Expo + Jest + Testing Library, Mercado Pago Checkout API, existing `ApiClient` / success-error envelopes.

---

## File Structure Map

### Backend
- Create: `Baluarte-core/src/main/resources/db/migration/V12__payment_orders_and_transactions.sql`
  - Creates lightweight persisted order + order item + payment transaction tables for payment linkage.
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/api/PaymentController.java`
  - Exposes `POST /api/v1/payment/requests`.
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/api/CreatePaymentRequest.java`
  - Request DTO with payer, shipping snapshot, cart items, Pix/card payload.
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/api/CreatePaymentResponse.java`
  - Normalized success payload returned to the app.
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentModuleConfiguration.java`
  - Wires use case + repositories + gateway.
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/CreatePaymentCommand.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/CreatePaymentUseCase.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentGateway.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentGatewayStrategy.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentGatewayResult.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/MockPaymentGatewayStrategy.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentValidationException.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/CheckoutOrder.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/CheckoutOrderItem.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/CheckoutOrderRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/PaymentTransaction.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/PaymentTransactionRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/CheckoutOrderJpaEntity.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/CheckoutOrderItemJpaEntity.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/PaymentTransactionJpaEntity.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/CheckoutOrderRepositoryAdapter.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/PaymentTransactionRepositoryAdapter.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/SpringDataCheckoutOrderJpaRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/SpringDataCheckoutOrderItemJpaRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/SpringDataPaymentTransactionJpaRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/MercadoPagoPaymentGatewayStrategy.java`
  - Calls Mercado Pago REST API using `RestClient` with idempotency header.
- Modify: `Baluarte-core/src/main/java/br/com/baluarte/core/shared/error/GlobalExceptionHandler.java`
  - Adds `PaymentValidationException` mapping to `VALIDATION_ERROR`.
- Modify: `Baluarte-core/src/main/resources/application.yml`
  - Adds `app.payment.active-provider`, Mercado Pago base URL + credentials.
- Modify: `Baluarte-core/src/main/resources/application-test.yml`
  - Forces mock provider in tests.
- Modify: `Baluarte-core/.env.example`
  - Adds payment provider env examples.
- Test: `Baluarte-core/src/test/java/br/com/baluarte/core/modules/payment/api/CheckoutPaymentIntegrationTest.java`

### Frontend
- Create: `Baluarte-web/src/lib/mobile/api/payments.ts`
  - Calls `/payment/requests` through `ApiClient`.
- Modify: `Baluarte-web/src/lib/mobile/api/contracts.ts`
  - Adds payment DTOs.
- Modify: `Baluarte-web/src/lib/mobile/env.ts`
  - Adds payment env resolution helpers.
- Create: `Baluarte-web/src/lib/mobile/payments/cardTokenProvider.ts`
  - Chooses `mock` vs `mercadopago` token provider by env.
- Create: `Baluarte-web/src/lib/mobile/payments/mockCardTokenProvider.ts`
  - Deterministic token bypass for Expo Go / tests.
- Create: `Baluarte-web/src/lib/mobile/payments/mercadoPagoCardTokenProvider.ts`
  - Mercado Pago-specific adapter file; returns config/runtime error when unsupported runtime lacks tokenization bridge.
- Create: `Baluarte-web/src/components/storefront/PaymentPixPanel.tsx`
  - Shows Pix QR, copy code, and pending state.
- Create: `Baluarte-web/src/components/storefront/PaymentCardForm.tsx`
  - Card fields, CPF, installments selector, and submit trigger.
- Modify: `Baluarte-web/src/pages/storefront/CheckoutScreen.tsx`
  - Replaces placeholder payment step with real Pix/card flow and recovery.
- Modify: `Baluarte-web/src/pages/storefront/types.ts`
  - Extends `CheckoutScreenProps` to create payments instead of fake finalization.
- Modify: `Baluarte-web/src/pages/AppRouteContent.tsx`
  - Wires `createPaymentRequest`, auth guard, local order update.
- Modify: `Baluarte-web/src/lib/types.ts`
  - Adds local order payment metadata.
- Modify: `Baluarte-web/.env.example`
  - Adds public payment env examples.
- Test: `Baluarte-web/src/lib/mobile/api/__tests__/payments.test.ts`
- Test: `Baluarte-web/src/pages/storefront/__tests__/CheckoutScreen.test.tsx`

---

### Task 1: Add backend persistence and request contracts

**Files:**
- Create: `Baluarte-core/src/main/resources/db/migration/V12__payment_orders_and_transactions.sql`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/api/CreatePaymentRequest.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/api/CreatePaymentResponse.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/CheckoutOrder.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/CheckoutOrderItem.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/CheckoutOrderRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/PaymentTransaction.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/domain/PaymentTransactionRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/CheckoutOrderJpaEntity.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/CheckoutOrderItemJpaEntity.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/PaymentTransactionJpaEntity.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/CheckoutOrderRepositoryAdapter.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/PaymentTransactionRepositoryAdapter.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/SpringDataCheckoutOrderJpaRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/SpringDataCheckoutOrderItemJpaRepository.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/SpringDataPaymentTransactionJpaRepository.java`
- Test: `Baluarte-core/src/test/java/br/com/baluarte/core/modules/payment/api/CheckoutPaymentIntegrationTest.java`

- [ ] **Step 1: Write the failing integration test**

```java
package br.com.baluarte.core.modules.payment.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckoutPaymentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldCreatePixPaymentAndReturnQrPayload() throws Exception {
        String payload = """
            {
              "checkoutSessionId": "chk-001",
              "idempotencyKey": "idem-pix-001",
              "method": "pix",
              "payer": {
                "email": "cliente@baluarte.com",
                "identification": { "type": "CPF", "number": "12345678909" }
              },
              "shippingAddress": {
                "cep": "01001-000",
                "street": "Rua A",
                "number": "100",
                "neighborhood": "Centro",
                "city": "Sao Paulo",
                "state": "SP"
              },
              "shipping": {
                "optionId": "standard",
                "label": "Padrao",
                "price": 19.90
              },
              "items": [
                {
                  "productId": "fla-home-2024",
                  "size": "M",
                  "quantity": 1,
                  "unitPrice": 299.90,
                  "customNames": ["JOAO"],
                  "customNumber": "10"
                }
              ]
            }
            """;

        mockMvc.perform(post("/api/v1/payment/requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.method").value("pix"))
            .andExpect(jsonPath("$.data.provider").value("mock"))
            .andExpect(jsonPath("$.data.status").value("pending"))
            .andExpect(jsonPath("$.data.pix.copyPasteCode").isString())
            .andExpect(jsonPath("$.data.pix.qrCodeBase64").isString())
            .andExpect(jsonPath("$.data.orderReference").isString());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-core" && ./mvnw -Dtest=CheckoutPaymentIntegrationTest test
```

Expected: FAIL with Spring MVC 404 or missing `payment` package classes / Flyway table errors.

- [ ] **Step 3: Write the minimal persistence + DTO implementation**

Create the Flyway migration with lightweight order + order item + payment tables:

```sql
CREATE TABLE checkout_order (
    order_id VARCHAR(36) PRIMARY KEY,
    checkout_session_id VARCHAR(64) NOT NULL,
    customer_ref VARCHAR(120),
    status VARCHAR(40) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    shipping_price NUMERIC(10,2) NOT NULL,
    shipping_cep VARCHAR(9) NOT NULL,
    shipping_street VARCHAR(120) NOT NULL,
    shipping_number VARCHAR(20) NOT NULL,
    shipping_neighborhood VARCHAR(120) NOT NULL,
    shipping_city VARCHAR(120) NOT NULL,
    shipping_state VARCHAR(2) NOT NULL,
    payment_reference VARCHAR(80),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE checkout_order_item (
    order_item_id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(80) NOT NULL,
    size VARCHAR(4) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    custom_names_count INT NOT NULL DEFAULT 0,
    custom_number_digits INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_checkout_order_item_order FOREIGN KEY (order_id) REFERENCES checkout_order(order_id) ON DELETE CASCADE
);

CREATE TABLE payment_transaction (
    payment_id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    provider VARCHAR(40) NOT NULL,
    provider_payment_id VARCHAR(80),
    method VARCHAR(20) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    installments INT,
    status VARCHAR(40) NOT NULL,
    status_detail VARCHAR(120),
    idempotency_key VARCHAR(80) NOT NULL UNIQUE,
    pix_qr_code TEXT,
    pix_qr_code_base64 TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_transaction_order FOREIGN KEY (order_id) REFERENCES checkout_order(order_id)
);
```

Create the request contract exactly once and reuse it through the backend layers:

```java
public record CreatePaymentRequest(
    @NotBlank String checkoutSessionId,
    @NotBlank String idempotencyKey,
    @NotBlank String method,
    @NotNull @Valid Payer payer,
    @NotNull @Valid ShippingAddress shippingAddress,
    @NotNull @Valid ShippingSelection shipping,
    @NotNull @Size(min = 1) List<@Valid Item> items,
    @Valid Card card
) {
    public record Payer(
        @Email @NotBlank String email,
        @NotNull @Valid Identification identification
    ) {}

    public record Identification(@NotBlank String type, @NotBlank String number) {}

    public record ShippingAddress(
        @NotBlank @Pattern(regexp = "^[0-9]{5}-?[0-9]{3}$") String cep,
        @NotBlank String street,
        @NotBlank String number,
        @NotBlank String neighborhood,
        @NotBlank String city,
        @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$") String state
    ) {}

    public record ShippingSelection(@NotBlank String optionId, @NotBlank String label, @NotNull @DecimalMin("0.00") BigDecimal price) {}

    public record Item(
        @NotBlank String productId,
        @NotBlank String size,
        @Min(1) int quantity,
        @NotNull @DecimalMin("0.00") BigDecimal unitPrice,
        List<@NotBlank String> customNames,
        @Pattern(regexp = "^[0-9]{0,2}$") String customNumber
    ) {}

    public record Card(
        @NotBlank String token,
        @NotBlank String paymentMethodId,
        String issuerId,
        @Min(1) @Max(12) Integer installments
    ) {}
}
```

Create a normalized response record so frontend never consumes provider-specific raw payloads:

```java
public record CreatePaymentResponse(
    String paymentId,
    String orderReference,
    String provider,
    String method,
    String status,
    String statusDetail,
    Integer installments,
    PixPayload pix
) {
    public record PixPayload(String qrCode, String qrCodeBase64, String copyPasteCode) {}
}
```

- [ ] **Step 4: Run Flyway + test to verify the foundation passes**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-core" && ./mvnw -Dtest=FlywayMigrationStartupTest,CheckoutPaymentIntegrationTest test
```

Expected: one remaining FAIL because controller/use case is still missing, but Flyway should no longer fail on missing tables.

- [ ] **Step 5: Commit**

```bash
git add Baluarte-core/src/main/resources/db/migration/V12__payment_orders_and_transactions.sql Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment Baluarte-core/src/test/java/br/com/baluarte/core/modules/payment/api/CheckoutPaymentIntegrationTest.java
git commit -m "feat(payment): add payment persistence foundation"
```

### Task 2: Implement payment use case, mock strategy, and API endpoint

**Files:**
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/api/PaymentController.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentModuleConfiguration.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/CreatePaymentCommand.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/CreatePaymentUseCase.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentGateway.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentGatewayStrategy.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentGatewayResult.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/MockPaymentGatewayStrategy.java`
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/application/PaymentValidationException.java`
- Modify: `Baluarte-core/src/main/java/br/com/baluarte/core/shared/error/GlobalExceptionHandler.java`
- Test: `Baluarte-core/src/test/java/br/com/baluarte/core/modules/payment/api/CheckoutPaymentIntegrationTest.java`

- [ ] **Step 1: Extend the failing integration tests for idempotency and card flow**

```java
@Test
void shouldReturnSamePaymentForRepeatedIdempotencyKey() throws Exception {
    String payload = """
        {
          "checkoutSessionId": "chk-001",
          "idempotencyKey": "idem-repeat-001",
          "method": "pix",
          "payer": {
            "email": "cliente@baluarte.com",
            "identification": { "type": "CPF", "number": "12345678909" }
          },
          "shippingAddress": {
            "cep": "01001-000",
            "street": "Rua A",
            "number": "100",
            "neighborhood": "Centro",
            "city": "Sao Paulo",
            "state": "SP"
          },
          "shipping": { "optionId": "standard", "label": "Padrao", "price": 19.90 },
          "items": [{ "productId": "fla-home-2024", "size": "M", "quantity": 1, "unitPrice": 299.90 }]
        }
        """;

    String first = mockMvc.perform(post("/api/v1/payment/requests").contentType(MediaType.APPLICATION_JSON).content(payload))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    String second = mockMvc.perform(post("/api/v1/payment/requests").contentType(MediaType.APPLICATION_JSON).content(payload))
        .andExpect(status().isOk())
        .andReturn().getResponse().getContentAsString();

    assertThat(JsonPath.read(first, "$.data.paymentId")).isEqualTo(JsonPath.read(second, "$.data.paymentId"));
}

@Test
void shouldCreateCardPaymentWithInstallmentsUsingMockProvider() throws Exception {
    String payload = """
        {
          "checkoutSessionId": "chk-card-001",
          "idempotencyKey": "idem-card-001",
          "method": "card",
          "payer": {
            "email": "cliente@baluarte.com",
            "identification": { "type": "CPF", "number": "12345678909" }
          },
          "shippingAddress": {
            "cep": "01001-000",
            "street": "Rua A",
            "number": "100",
            "neighborhood": "Centro",
            "city": "Sao Paulo",
            "state": "SP"
          },
          "shipping": { "optionId": "express", "label": "Expresso", "price": 29.90 },
          "items": [{ "productId": "fla-home-2024", "size": "M", "quantity": 1, "unitPrice": 299.90 }],
          "card": {
            "token": "mock-approved-token",
            "paymentMethodId": "visa",
            "issuerId": "123",
            "installments": 3
          }
        }
        """;

    mockMvc.perform(post("/api/v1/payment/requests")
            .contentType(MediaType.APPLICATION_JSON)
            .content(payload))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.method").value("card"))
        .andExpect(jsonPath("$.data.installments").value(3));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-core" && ./mvnw -Dtest=CheckoutPaymentIntegrationTest test
```

Expected: FAIL because `/api/v1/payment/requests` is still missing and idempotent retrieval is unimplemented.

- [ ] **Step 3: Write the minimal controller + use case + mock strategy**

Use the existing shipping strategy style as the model for gateway resolution:

```java
@Service
public class PaymentGateway {

    private final String activeProvider;
    private final Map<String, PaymentGatewayStrategy> strategies;

    public PaymentGateway(
        @Value("${app.payment.active-provider:mock}") String activeProvider,
        List<PaymentGatewayStrategy> strategies
    ) {
        this.activeProvider = normalize(activeProvider);
        this.strategies = strategies.stream().collect(Collectors.toMap(
            strategy -> normalize(strategy.providerKey()),
            Function.identity()
        ));
    }

    public String activeProvider() {
        return activeProvider;
    }

    public PaymentGatewayResult create(CreatePaymentCommand command) {
        PaymentGatewayStrategy strategy = strategies.get(activeProvider);
        if (strategy == null) {
            throw new IllegalStateException("No payment strategy configured for provider: " + activeProvider);
        }
        return strategy.create(command);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
```

Implement deterministic mock behavior:

```java
@Component
public class MockPaymentGatewayStrategy implements PaymentGatewayStrategy {

    @Override
    public String providerKey() {
        return "mock";
    }

    @Override
    public PaymentGatewayResult create(CreatePaymentCommand command) {
        String providerPaymentId = "mock-" + command.idempotencyKey();
        if ("pix".equals(command.method())) {
            return PaymentGatewayResult.pendingPix(
                providerPaymentId,
                "pending",
                "pending_waiting_transfer",
                "00020126580014br.gov.bcb.pix0136mock-baluarte-payment5204000053039865405299.905802BR",
                "bW9jay1waXgtcXItYmFzZTY0",
                "00020126580014br.gov.bcb.pix0136mock-baluarte-payment5204000053039865405299.905802BR"
            );
        }

        String token = command.cardToken();
        if (token != null && token.contains("reject")) {
            return PaymentGatewayResult.rejectedCard(providerPaymentId, "rejected", "cc_rejected_bad_filled_card_number", command.installments());
        }

        return PaymentGatewayResult.approvedCard(providerPaymentId, "approved", "accredited", command.installments());
    }
}
```

Create the endpoint and map domain result into the standard envelope:

```java
@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final CreatePaymentUseCase createPaymentUseCase;
    private final PaymentGateway paymentGateway;

    @PostMapping("/requests")
    public ApiSuccessResponse<CreatePaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        CreatePaymentResponse response = createPaymentUseCase.execute(request, paymentGateway.activeProvider());
        return ApiSuccessResponse.of(response);
    }
}
```

Map `PaymentValidationException` in the global handler the same way `AdminProductValidationException` is handled.

- [ ] **Step 4: Run tests to verify mock payment flow passes**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-core" && ./mvnw -Dtest=CheckoutPaymentIntegrationTest test
```

Expected: PASS for Pix creation, idempotency, and mock card installments.

- [ ] **Step 5: Commit**

```bash
git add Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment Baluarte-core/src/main/java/br/com/baluarte/core/shared/error/GlobalExceptionHandler.java Baluarte-core/src/test/java/br/com/baluarte/core/modules/payment/api/CheckoutPaymentIntegrationTest.java
git commit -m "feat(payment): implement mock payment gateway flow"
```

### Task 3: Add Mercado Pago adapter and environment wiring

**Files:**
- Create: `Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/MercadoPagoPaymentGatewayStrategy.java`
- Modify: `Baluarte-core/src/main/resources/application.yml`
- Modify: `Baluarte-core/src/main/resources/application-test.yml`
- Modify: `Baluarte-core/.env.example`
- Test: `Baluarte-core/src/test/java/br/com/baluarte/core/modules/payment/api/CheckoutPaymentIntegrationTest.java`

- [ ] **Step 1: Add the failing adapter test for provider selection**

```java
@Test
void shouldReturnConfiguredProviderNameWhenMercadoPagoIsSelected() throws Exception {
    TestPropertyValues.of(
        "app.payment.active-provider=mercadopago",
        "app.payment.mercadopago.access-token=test-token",
        "app.payment.mercadopago.base-url=https://api.mercadopago.com"
    ).applyToSystemProperties(() -> {
        PaymentGateway gateway = applicationContext.getBean(PaymentGateway.class);
        assertThat(gateway.activeProvider()).isEqualTo("mercadopago");
    });
}
```

- [ ] **Step 2: Run the backend payment tests to verify the new adapter path fails**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-core" && ./mvnw -Dtest=CheckoutPaymentIntegrationTest test
```

Expected: FAIL because `mercadopago` strategy is missing or provider properties are undefined.

- [ ] **Step 3: Implement the Mercado Pago REST adapter and env properties**

Use Spring `RestClient` so no new dependency is needed:

```java
@Component
public class MercadoPagoPaymentGatewayStrategy implements PaymentGatewayStrategy {

    private final RestClient restClient;
    private final String accessToken;

    public MercadoPagoPaymentGatewayStrategy(
        @Value("${app.payment.mercadopago.base-url:https://api.mercadopago.com}") String baseUrl,
        @Value("${app.payment.mercadopago.access-token:}") String accessToken
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.accessToken = accessToken;
    }

    @Override
    public String providerKey() {
        return "mercadopago";
    }

    @Override
    public PaymentGatewayResult create(CreatePaymentCommand command) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalStateException("Mercado Pago access token not configured");
        }

        Map<String, Object> body = "pix".equals(command.method())
            ? Map.of(
                "transaction_amount", command.amount(),
                "payment_method_id", "pix",
                "payer", Map.of(
                    "email", command.payerEmail(),
                    "identification", Map.of("type", command.payerDocumentType(), "number", command.payerDocumentNumber())
                )
            )
            : Map.of(
                "transaction_amount", command.amount(),
                "token", command.cardToken(),
                "installments", command.installments(),
                "payment_method_id", command.cardPaymentMethodId(),
                "issuer_id", command.cardIssuerId(),
                "description", "Baluarte order " + command.checkoutSessionId(),
                "payer", Map.of(
                    "email", command.payerEmail(),
                    "identification", Map.of("type", command.payerDocumentType(), "number", command.payerDocumentNumber())
                )
            );

        MercadoPagoPaymentResponse response = restClient.post()
            .uri("/v1/payments")
            .header("Authorization", "Bearer " + accessToken)
            .header("X-Idempotency-Key", command.idempotencyKey())
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(MercadoPagoPaymentResponse.class);

        return PaymentGatewayResult.fromMercadoPago(response, command.method(), command.installments());
    }
}
```

Update config defaults:

```yaml
app:
  payment:
    active-provider: ${APP_PAYMENT_PROVIDER:mock}
    mercadopago:
      base-url: ${APP_PAYMENT_MERCADOPAGO_BASE_URL:https://api.mercadopago.com}
      access-token: ${APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN:}
      public-key: ${APP_PAYMENT_MERCADOPAGO_PUBLIC_KEY:}
```

Update `.env.example`:

```dotenv
APP_PAYMENT_PROVIDER=mock
APP_PAYMENT_MERCADOPAGO_BASE_URL=https://api.mercadopago.com
APP_PAYMENT_MERCADOPAGO_ACCESS_TOKEN=
APP_PAYMENT_MERCADOPAGO_PUBLIC_KEY=
```

- [ ] **Step 4: Run backend tests to verify mock still passes and provider wiring is stable**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-core" && ./mvnw -Dtest=CheckoutPaymentIntegrationTest,FlywayMigrationStartupTest test
```

Expected: PASS with `test` profile still using `mock`.

- [ ] **Step 5: Commit**

```bash
git add Baluarte-core/src/main/java/br/com/baluarte/core/modules/payment/infrastructure/MercadoPagoPaymentGatewayStrategy.java Baluarte-core/src/main/resources/application.yml Baluarte-core/src/main/resources/application-test.yml Baluarte-core/.env.example
git commit -m "feat(payment): wire mercado pago adapter"
```

### Task 4: Add frontend payment contracts, token provider abstraction, and API client

**Files:**
- Create: `Baluarte-web/src/lib/mobile/api/payments.ts`
- Modify: `Baluarte-web/src/lib/mobile/api/contracts.ts`
- Modify: `Baluarte-web/src/lib/mobile/env.ts`
- Create: `Baluarte-web/src/lib/mobile/payments/cardTokenProvider.ts`
- Create: `Baluarte-web/src/lib/mobile/payments/mockCardTokenProvider.ts`
- Create: `Baluarte-web/src/lib/mobile/payments/mercadoPagoCardTokenProvider.ts`
- Test: `Baluarte-web/src/lib/mobile/api/__tests__/payments.test.ts`
- Modify: `Baluarte-web/.env.example`

- [ ] **Step 1: Write the failing frontend API + token provider tests**

```ts
import { ApiClient } from "../client";
import { createPaymentRequest } from "../payments";
import { createCardToken } from "../../payments/cardTokenProvider";

jest.mock("../../payments/mockCardTokenProvider", () => ({
  createMockCardToken: jest.fn(async () => ({ token: "mock-approved-token", paymentMethodId: "visa", issuerId: "123" }))
}));

describe("payments api", () => {
  it("posts pix payload to /payment/requests", async () => {
    const request = jest.spyOn(ApiClient.prototype, "request").mockResolvedValue({
      data: {
        paymentId: "pay-1",
        orderReference: "ord-1",
        provider: "mock",
        method: "pix",
        status: "pending",
        statusDetail: "pending_waiting_transfer",
        pix: { qrCode: "000201", qrCodeBase64: "YmFzZTY0", copyPasteCode: "000201" }
      }
    });

    await createPaymentRequest({
      checkoutSessionId: "chk-1",
      idempotencyKey: "idem-1",
      method: "pix",
      payer: { email: "cliente@baluarte.com", identification: { type: "CPF", number: "12345678909" } },
      shippingAddress: { cep: "01001-000", street: "Rua A", number: "100", neighborhood: "Centro", city: "Sao Paulo", state: "SP" },
      shipping: { optionId: "standard", label: "Padrao", price: 19.9 },
      items: [{ productId: "fla-home-2024", size: "M", quantity: 1, unitPrice: 299.9, customNames: ["JOAO"], customNumber: "10" }]
    });

    expect(request).toHaveBeenCalledWith("/payment/requests", expect.objectContaining({ method: "POST" }));
  });

  it("returns mock card token in mock mode", async () => {
    process.env.EXPO_PUBLIC_PAYMENT_CARD_TOKEN_MODE = "mock";
    const token = await createCardToken({
      number: "4111111111111111",
      holderName: "JOAO TESTE",
      expirationMonth: "11",
      expirationYear: "30",
      cvv: "123",
      cpf: "12345678909",
      total: 349.8
    });

    expect(token.token).toBe("mock-approved-token");
  });
});
```

- [ ] **Step 2: Run the frontend tests to verify they fail**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-web" && npm test -- --runInBand src/lib/mobile/api/__tests__/payments.test.ts
```

Expected: FAIL because `payments.ts` and card token provider files do not exist yet.

- [ ] **Step 3: Implement the payment DTOs, API call, and token provider abstraction**

Extend `contracts.ts` with explicit request/response types:

```ts
export interface PaymentRequestDto {
  checkoutSessionId: string;
  idempotencyKey: string;
  method: "pix" | "card";
  payer: {
    email: string;
    identification: { type: "CPF" | "CNPJ"; number: string };
  };
  shippingAddress: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  shipping: {
    optionId: string;
    label: string;
    price: number;
  };
  items: Array<{
    productId: string;
    size: string;
    quantity: number;
    unitPrice: number;
    customNames?: string[];
    customNumber?: string;
  }>;
  card?: {
    token: string;
    paymentMethodId: string;
    issuerId?: string;
    installments: number;
  };
}

export interface PaymentResponseDto {
  paymentId: string;
  orderReference: string;
  provider: string;
  method: "pix" | "card";
  status: string;
  statusDetail: string;
  installments?: number;
  pix?: {
    qrCode: string;
    qrCodeBase64: string;
    copyPasteCode: string;
  };
}
```

Create the API call:

```ts
const defaultClient = new ApiClient();

export async function createPaymentRequest(
  payload: PaymentRequestDto,
  client: ApiClient = defaultClient
): Promise<PaymentResponseDto> {
  const response = await client.request<PaymentResponseDto>("/payment/requests", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return response.data;
}
```

Implement the provider selector:

```ts
import { resolveCardTokenMode } from "../env";
import { createMockCardToken } from "./mockCardTokenProvider";
import { createMercadoPagoCardToken } from "./mercadoPagoCardTokenProvider";

export type CardTokenInput = {
  number: string;
  holderName: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  cpf: string;
  total: number;
};

export async function createCardToken(input: CardTokenInput) {
  return resolveCardTokenMode() === "mercadopago"
    ? createMercadoPagoCardToken(input)
    : createMockCardToken(input);
}
```

Implement the deterministic bypass:

```ts
export async function createMockCardToken(input: CardTokenInput) {
  const digits = input.number.replace(/\D/g, "");
  const status = digits.endsWith("0000") ? "reject" : "approved";
  return {
    token: status === "reject" ? "mock-reject-token" : "mock-approved-token",
    paymentMethodId: digits.startsWith("5") ? "master" : "visa",
    issuerId: "123"
  };
}
```

Implement the Mercado Pago adapter file with an explicit unsupported-runtime error instead of silently leaking card data to the backend:

```ts
export async function createMercadoPagoCardToken(_: CardTokenInput) {
  const runtime = typeof navigator !== "undefined" ? navigator.product : "unknown";
  throw {
    code: "CARD_TOKEN_PROVIDER_NOT_AVAILABLE",
    message:
      runtime === "ReactNative"
        ? "Mercado Pago card tokenization requires a supported native bridge/dev build. Use mock card token mode in Expo Go."
        : "Mercado Pago card token provider is not configured for this runtime."
  };
}
```

Add env helpers:

```ts
export function resolveCardTokenMode(): "mock" | "mercadopago" {
  return process.env.EXPO_PUBLIC_PAYMENT_CARD_TOKEN_MODE === "mercadopago" ? "mercadopago" : "mock";
}

export function resolveMercadoPagoPublicKey(): string {
  return process.env.EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() ?? "";
}
```

Update `.env.example`:

```dotenv
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=
EXPO_PUBLIC_PAYMENT_CARD_TOKEN_MODE=mock
EXPO_PUBLIC_PAYMENT_PROVIDER=mock
```

- [ ] **Step 4: Run the frontend API/token tests to verify they pass**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-web" && npm test -- --runInBand src/lib/mobile/api/__tests__/payments.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Baluarte-web/src/lib/mobile/api/contracts.ts Baluarte-web/src/lib/mobile/api/payments.ts Baluarte-web/src/lib/mobile/env.ts Baluarte-web/src/lib/mobile/payments Baluarte-web/src/lib/mobile/api/__tests__/payments.test.ts Baluarte-web/.env.example
git commit -m "feat(payment): add frontend payment contracts and token providers"
```

### Task 5: Replace checkout payment step with real Pix/card flow and local order update

**Files:**
- Create: `Baluarte-web/src/components/storefront/PaymentPixPanel.tsx`
- Create: `Baluarte-web/src/components/storefront/PaymentCardForm.tsx`
- Modify: `Baluarte-web/src/pages/storefront/types.ts`
- Modify: `Baluarte-web/src/pages/storefront/CheckoutScreen.tsx`
- Modify: `Baluarte-web/src/pages/AppRouteContent.tsx`
- Modify: `Baluarte-web/src/lib/types.ts`
- Test: `Baluarte-web/src/pages/storefront/__tests__/CheckoutScreen.test.tsx`

- [ ] **Step 1: Write the failing checkout screen tests for Pix, card retry, and method switching**

```ts
it("creates pix payment and shows qr payload in the payment step", async () => {
  const onCreatePayment = jest.fn(async () => ({
    ok: true as const,
    response: {
      paymentId: "pay-pix-1",
      orderReference: "ord-1",
      provider: "mock",
      method: "pix" as const,
      status: "pending",
      statusDetail: "pending_waiting_transfer",
      pix: { qrCode: "000201", qrCodeBase64: "YmFzZTY0", copyPasteCode: "000201" }
    }
  }));

  renderCheckout({ onCreatePayment, initialStep: 3, user: authenticatedUser, guestAddressDraft: guestAddress });

  fireEvent.press(screen.getByText("PIX"));
  await act(async () => {
    fireEvent.press(screen.getByText("Gerar PIX"));
    await Promise.resolve();
  });

  expect(onCreatePayment).toHaveBeenCalledWith(expect.objectContaining({ method: "pix" }));
  expect(screen.getByText("Copiar codigo PIX")).toBeTruthy();
});

it("creates card payment with installments and preserves checkout on rejection", async () => {
  const onCreatePayment = jest.fn(async () => ({
    ok: false as const,
    error: "Pagamento recusado. Tente outro cartao ou troque para PIX."
  }));

  renderCheckout({ onCreatePayment, initialStep: 3, user: authenticatedUser, guestAddressDraft: guestAddress });

  fireEvent.press(screen.getByText("Cartao de credito"));
  fireEvent.changeText(screen.getByPlaceholderText("Numero do cartao"), "4111111111110000");
  fireEvent.changeText(screen.getByPlaceholderText("Nome impresso no cartao"), "JOAO TESTE");
  fireEvent.changeText(screen.getByPlaceholderText("MM"), "11");
  fireEvent.changeText(screen.getByPlaceholderText("AA"), "30");
  fireEvent.changeText(screen.getByPlaceholderText("CVV"), "123");
  fireEvent.changeText(screen.getByPlaceholderText("CPF do titular"), "12345678909");
  fireEvent.press(screen.getByText("3x sem juros"));

  await act(async () => {
    fireEvent.press(screen.getByText("Pagar com cartao"));
    await Promise.resolve();
  });

  expect(screen.getByText("Pagamento recusado. Tente outro cartao ou troque para PIX.")).toBeTruthy();
  expect(screen.getByText("PIX")).toBeTruthy();
});
```

- [ ] **Step 2: Run the checkout tests to verify they fail**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-web" && npm test -- --runInBand src/pages/storefront/__tests__/CheckoutScreen.test.tsx
```

Expected: FAIL because the screen still contains placeholder payment cards and `onFinalizeOrder` instead of real payment creation.

- [ ] **Step 3: Implement the payment UI split and wire it through `AppRouteContent`**

Create a focused Pix panel:

```tsx
export function PaymentPixPanel({
  total,
  pix,
  loading,
  error,
  onGeneratePix,
  onCopyCode
}: {
  total: number;
  pix: { qrCodeBase64: string; copyPasteCode: string } | null;
  loading: boolean;
  error: string;
  onGeneratePix: () => void;
  onCopyCode: () => void;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: "600", fontSize: 14 }}>Pagamento via PIX</Text>
      <Text style={styles.screenDescription}>Total: {toBrl(total)}</Text>
      {pix ? <Image source={{ uri: `data:image/png;base64,${pix.qrCodeBase64}` }} style={{ width: 220, height: 220, alignSelf: "center" }} /> : null}
      {pix ? (
        <Pressable style={styles.secondaryActionButton} onPress={onCopyCode}>
          <Text style={styles.secondaryActionButtonText}>Copiar codigo PIX</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.primaryActionButton} onPress={onGeneratePix} disabled={loading}>
          <Text style={styles.primaryActionButtonText}>{loading ? "Gerando PIX..." : "Gerar PIX"}</Text>
        </Pressable>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
```

Create a focused card form:

```tsx
export function PaymentCardForm({
  loading,
  error,
  installments,
  selectedInstallments,
  onSelectInstallments,
  onSubmit
}: {
  loading: boolean;
  error: string;
  installments: number[];
  selectedInstallments: number;
  onSelectInstallments: (value: number) => void;
  onSubmit: (payload: {
    number: string;
    holderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
    cpf: string;
  }) => void;
}) {
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");

  return (
    <View style={{ marginTop: 12 }}>
      <TextInput style={styles.formInput} placeholder="Numero do cartao" value={number} onChangeText={setNumber} keyboardType="number-pad" />
      <TextInput style={styles.formInput} placeholder="Nome impresso no cartao" value={holderName} onChangeText={setHolderName} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="MM" value={expirationMonth} onChangeText={setExpirationMonth} keyboardType="number-pad" />
        <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="AA" value={expirationYear} onChangeText={setExpirationYear} keyboardType="number-pad" />
        <TextInput style={[styles.formInput, { flex: 1 }]} placeholder="CVV" value={cvv} onChangeText={setCvv} keyboardType="number-pad" secureTextEntry />
      </View>
      <TextInput style={styles.formInput} placeholder="CPF do titular" value={cpf} onChangeText={setCpf} keyboardType="number-pad" />
      {installments.map((option) => (
        <Pressable key={option} style={styles.summaryCard} onPress={() => onSelectInstallments(option)}>
          <Text style={{ fontWeight: selectedInstallments === option ? "700" : "500" }}>{option}x sem juros</Text>
        </Pressable>
      ))}
      <Pressable
        style={[styles.primaryActionButton, loading ? { opacity: 0.7 } : null]}
        disabled={loading}
        onPress={() => onSubmit({ number, holderName, expirationMonth, expirationYear, cvv, cpf })}
      >
        <Text style={styles.primaryActionButtonText}>{loading ? "Processando cartao..." : "Pagar com cartao"}</Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}
```

Replace `onFinalizeOrder` in `CheckoutScreenProps` with a typed `onCreatePayment` callback:

```ts
onCreatePayment: (
  payload:
    | { method: "pix"; shippingAddress: Address }
    | {
        method: "card";
        shippingAddress: Address;
        card: {
          number: string;
          holderName: string;
          expirationMonth: string;
          expirationYear: string;
          cvv: string;
          cpf: string;
          installments: number;
        };
      }
) => Promise<{ ok: true; response: PaymentResponseDto } | { ok: false; requiresAuth?: boolean; error: string }>;
```

In `AppRouteContent.tsx`, replace the fake finalization branch with real API orchestration:

```tsx
onCreatePayment={async (payload) => {
  const authorization = await ensureCheckoutFinalizationAuthorized(user, authSession);
  if (!authorization.ok) {
    return { ok: false as const, requiresAuth: true as const, error: "Autenticacao necessaria." };
  }

  const shippingAddress = payload.shippingAddress;
  const items = cartItems.map((item) => ({
    productId: item.product.id,
    size: item.size,
    quantity: item.quantity,
    unitPrice: item.product.price,
    customNames: item.customNames,
    customNumber: item.customNumber
  }));

  const card = payload.method === "card"
    ? {
        ...(await createCardToken({
          number: payload.card.number,
          holderName: payload.card.holderName,
          expirationMonth: payload.card.expirationMonth,
          expirationYear: payload.card.expirationYear,
          cvv: payload.card.cvv,
          cpf: payload.card.cpf,
          total
        })),
        installments: payload.card.installments
      }
    : undefined;

  try {
    const response = await createPaymentRequest({
      checkoutSessionId: `chk-${Date.now()}`,
      idempotencyKey: `pay-${Date.now()}`,
      method: payload.method,
      payer: {
        email: user?.email ?? "guest@baluarte.local",
        identification: { type: "CPF", number: payload.method === "card" ? payload.card.cpf : "12345678909" }
      },
      shippingAddress,
      shipping: {
        optionId: "selected-shipping",
        label: "Frete selecionado",
        price: shipping
      },
      items,
      card: card
        ? {
            token: card.token,
            paymentMethodId: card.paymentMethodId,
            issuerId: card.issuerId,
            installments: card.installments
          }
        : undefined
    });

    return { ok: true as const, response };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Nao foi possivel processar o pagamento." };
  }
}}
```

Update the local order type with payment metadata so the app can show state later:

```ts
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "aguardando_pagamento" | "pago" | "pronto_envio" | "enviado" | "entregue";
  paymentMethod?: "pix" | "card";
  paymentStatus?: string;
  paymentReference?: string;
  createdAt: Date;
  shippingAddress: Address;
}
```

- [ ] **Step 4: Run checkout and API tests to verify the real payment step passes**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-web" && npm test -- --runInBand src/lib/mobile/api/__tests__/payments.test.ts src/pages/storefront/__tests__/CheckoutScreen.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Baluarte-web/src/components/storefront/PaymentPixPanel.tsx Baluarte-web/src/components/storefront/PaymentCardForm.tsx Baluarte-web/src/pages/storefront/CheckoutScreen.tsx Baluarte-web/src/pages/storefront/types.ts Baluarte-web/src/pages/AppRouteContent.tsx Baluarte-web/src/lib/types.ts Baluarte-web/src/pages/storefront/__tests__/CheckoutScreen.test.tsx
git commit -m "feat(checkout): add pix and card payment step"
```

### Task 6: Run full targeted verification and fix the first red failure

**Files:**
- Modify as needed: any file touched in Tasks 1-5
- Test: `Baluarte-core/src/test/java/br/com/baluarte/core/modules/payment/api/CheckoutPaymentIntegrationTest.java`
- Test: `Baluarte-web/src/lib/mobile/api/__tests__/payments.test.ts`
- Test: `Baluarte-web/src/pages/storefront/__tests__/CheckoutScreen.test.tsx`

- [ ] **Step 1: Run backend targeted tests**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-core" && ./mvnw -Dtest=CheckoutPaymentIntegrationTest,FlywayMigrationStartupTest test
```

Expected: PASS with `BUILD SUCCESS`.

- [ ] **Step 2: Run frontend targeted tests**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-web" && npm test -- --runInBand src/lib/mobile/api/__tests__/payments.test.ts src/pages/storefront/__tests__/CheckoutScreen.test.tsx
```

Expected: PASS with both suites green.

- [ ] **Step 3: Run frontend lint for touched files**

Run:
```bash
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-web" && npm run lint -- src/lib/mobile/api/contracts.ts src/lib/mobile/api/payments.ts src/lib/mobile/payments/cardTokenProvider.ts src/lib/mobile/payments/mockCardTokenProvider.ts src/lib/mobile/payments/mercadoPagoCardTokenProvider.ts src/components/storefront/PaymentPixPanel.tsx src/components/storefront/PaymentCardForm.tsx src/pages/storefront/CheckoutScreen.tsx src/pages/AppRouteContent.tsx
```

Expected: PASS with no lint errors.

- [ ] **Step 4: If one command fails, make the minimal fix immediately and rerun only that command**

Use this loop only once per failure:

```bash
# backend example
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-core" && ./mvnw -Dtest=CheckoutPaymentIntegrationTest test

# frontend example
cd "G:/Documentos/Baluarte/Baluarte/Baluarte-web" && npm test -- --runInBand src/pages/storefront/__tests__/CheckoutScreen.test.tsx
```

Expected: PASS after the minimal targeted fix.

- [ ] **Step 5: Commit**

```bash
git add Baluarte-core Baluarte-web
git commit -m "test(payment): verify story 4.1 payment flow"
```

## Self-Review Coverage

### Spec coverage
- Pix QR + copy/paste in app: Task 2 + Task 5
- Card in app with installments: Task 4 + Task 5
- Strategy gateway with mock + Mercado Pago: Task 2 + Task 3
- Idempotency: Task 2 integration tests and use case
- Order created/updated with payment reference: Task 1 + Task 2
- No sensitive credentials persisted: Task 1 persistence schema + Task 4 token provider separation
- Environment-driven enablement: Task 3 + Task 4
- Retry/recovery and method switching: Task 5 tests/UI

### Placeholder scan
- No `TODO`, `TBD`, or “similar to task N” references remain.
- Every task includes exact file paths, commands, and code snippets.

### Type consistency
- Backend request type: `CreatePaymentRequest`
- Backend response type: `CreatePaymentResponse`
- Frontend request type: `PaymentRequestDto`
- Frontend response type: `PaymentResponseDto`
- Gateway port: `PaymentGatewayStrategy`
- Use case input: `CreatePaymentCommand`

