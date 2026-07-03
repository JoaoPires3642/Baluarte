package br.com.baluarte.core.modules.payment.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.baluarte.core.modules.adminproduct.infrastructure.AdminProductVariantJpaEntity;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductJpaRepository;
import br.com.baluarte.core.modules.adminproduct.infrastructure.SpringDataAdminProductVariantJpaRepository;
import br.com.baluarte.core.modules.payment.infrastructure.SpringDataCheckoutOrderItemJpaRepository;
import br.com.baluarte.core.modules.payment.infrastructure.SpringDataCheckoutOrderJpaRepository;
import br.com.baluarte.core.modules.payment.infrastructure.SpringDataPaymentTransactionJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "app.auth.admin-emails=admin@baluarte.com")
class CheckoutOrderSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SpringDataAdminProductJpaRepository productRepository;

    @Autowired
    private SpringDataAdminProductVariantJpaRepository variantRepository;

    @Autowired
    private SpringDataCheckoutOrderJpaRepository orderRepository;

    @Autowired
    private SpringDataCheckoutOrderItemJpaRepository orderItemRepository;

    @Autowired
    private SpringDataPaymentTransactionJpaRepository transactionRepository;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
    }

    @Test
    void shouldCreateOrderWithRealItemsReserveStockAndExposeOnlyOwnerOrders() throws Exception {
        String productId = createProductAndExtractId("Camisa Teste Estoque", 2);

        MvcResult payment = mockMvc.perform(post("/api/v1/payment/requests")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-Id", "user_1")
                .content(paymentPayload("session-1", "key-1", productId, 1)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("pending"))
            .andReturn();

        String orderId = com.jayway.jsonpath.JsonPath.read(payment.getResponse().getContentAsString(), "$.data.orderId");

        AdminProductVariantJpaEntity variant = variantRepository.findAll().getFirst();
        assertThat(variant.getStockQuantity()).isEqualTo(1);
        assertThat(orderItemRepository.findByOrderId(orderId)).hasSize(1);

        mockMvc.perform(get("/api/v1/orders/my")
                .header("X-User-Id", "user_1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.length()").value(1))
            .andExpect(jsonPath("$.data[0].id").value(orderId))
            .andExpect(jsonPath("$.data[0].items[0].name").value("Camisa Teste Estoque"))
            .andExpect(jsonPath("$.data[0].shipping.recipientName").value("Joao Cliente"));

        mockMvc.perform(get("/api/v1/orders/my/{orderId}", orderId)
                .header("X-User-Id", "user_2"))
            .andExpect(status().isNotFound());
    }

    @Test
    void shouldRejectCheckoutWithoutStockAndKeepStockUnchanged() throws Exception {
        String productId = createProductAndExtractId("Camisa Teste Sem Estoque", 1);

        mockMvc.perform(post("/api/v1/payment/requests")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-Id", "user_1")
                .content(paymentPayload("session-2", "key-2", productId, 2)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));

        assertThat(variantRepository.findAll().getFirst().getStockQuantity()).isEqualTo(1);
        assertThat(orderRepository.count()).isZero();
    }

    @Test
    void shouldAllowOwnerToCancelPendingPaymentOrderAndReleaseStock() throws Exception {
        String productId = createProductAndExtractId("Camisa Teste Cancelamento", 2);

        MvcResult payment = mockMvc.perform(post("/api/v1/payment/requests")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-Id", "user_1")
                .content(paymentPayload("session-cancel-1", "key-cancel-1", productId, 1)))
            .andExpect(status().isOk())
            .andReturn();

        String orderId = com.jayway.jsonpath.JsonPath.read(payment.getResponse().getContentAsString(), "$.data.orderId");
        assertThat(variantRepository.findAll().getFirst().getStockQuantity()).isEqualTo(1);

        mockMvc.perform(post("/api/v1/orders/my/{orderId}/cancel", orderId)
                .header("X-User-Id", "user_2"))
            .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/orders/my/{orderId}/cancel", orderId)
                .header("X-User-Id", "user_1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.status").value("cancelled"));

        assertThat(variantRepository.findAll().getFirst().getStockQuantity()).isEqualTo(2);
    }

    private String createProductAndExtractId(String modelName, int stockQuantity) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/admin/products")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-Id", "admin_1")
                .header("X-User-Email", "admin@baluarte.com")
                .content("""
                    {
                      "categorySlug": "nacionais",
                      "teamSlug": "flamengo",
                      "modelName": "%s",
                      "description": "Produto de teste",
                      "price": 249.90,
                      "imageUrl": "https://cdn.baluarte.com/produto.png",
                      "customizationEnabled": false,
                      "sizeCategory": "ADULTO",
                      "variants": [
                        {"size": "M", "stockQuantity": %d}
                      ]
                    }
                    """.formatted(modelName, stockQuantity)))
            .andExpect(status().isOk())
            .andReturn();

        return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.data.id");
    }

    private String paymentPayload(String sessionId, String idempotencyKey, String productId, int quantity) {
        return """
            {
              "checkoutSessionId": "%s",
              "idempotencyKey": "%s",
              "method": "pix",
              "payer": {
                "email": "cliente@baluarte.com",
                "identification": {"type": "CPF", "number": "12345678909"}
              },
              "shippingAddress": {
                "recipientName": "Joao Cliente",
                "cep": "01001000",
                "street": "Rua A",
                "number": "100",
                "complement": "Apto 1",
                "neighborhood": "Centro",
                "city": "Sao Paulo",
                "state": "SP"
              },
              "shipping": {"optionId": "mock-sedex", "label": "SEDEX", "price": 19.90},
              "items": [
                {"productId": "%s", "size": "M", "quantity": %d, "unitPrice": 1.00}
              ]
            }
            """.formatted(sessionId, idempotencyKey, productId, quantity);
    }
}
