package br.com.baluarte.core.modules.checkout.infrastructure;

import br.com.baluarte.core.modules.checkout.application.ShippingQuoteCommand;
import br.com.baluarte.core.modules.checkout.application.ShippingQuoteOption;
import br.com.baluarte.core.modules.checkout.application.ShippingQuoteStrategy;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class SuperFreteShippingQuoteStrategy implements ShippingQuoteStrategy {

    private final RestClient restClient;
    private final String token;
    private final String originCep;
    private final String services;
    private final String userAgent;
    private final double productWeightKg;
    private final int productHeightCm;
    private final int productWidthCm;
    private final int productLengthCm;
    private final AdminShippingSettingsService settingsService;

    public SuperFreteShippingQuoteStrategy(
        @Value("${app.shipping.superfrete.base-url:https://sandbox.superfrete.com}") String baseUrl,
        @Value("${app.shipping.superfrete.token:}") String token,
        @Value("${app.shipping.origin-cep:01153000}") String originCep,
        @Value("${app.shipping.superfrete.services:1,2,17}") String services,
        @Value("${app.shipping.superfrete.user-agent:Baluarte/1.0 (contato@baluarte.com)}") String userAgent,
        @Value("${app.shipping.package.product-weight-kg:0.3}") double productWeightKg,
        @Value("${app.shipping.package.product-height-cm:4}") int productHeightCm,
        @Value("${app.shipping.package.product-width-cm:25}") int productWidthCm,
        @Value("${app.shipping.package.product-length-cm:35}") int productLengthCm,
        AdminShippingSettingsService settingsService
    ) {
        this.token = token;
        this.originCep = originCep;
        this.services = services;
        this.userAgent = userAgent;
        this.productWeightKg = productWeightKg;
        this.productHeightCm = productHeightCm;
        this.productWidthCm = productWidthCm;
        this.productLengthCm = productLengthCm;
        this.settingsService = settingsService;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        this.restClient = RestClient.builder()
            .requestFactory(factory)
            .baseUrl(baseUrl)
            .build();
    }

    @Override
    public String providerKey() {
        return "superfrete";
    }

    @Override
    public List<ShippingQuoteOption> quote(ShippingQuoteCommand command) {
        AdminShippingSettingsValues settings = settingsService.get();
        if (settings.superfreteToken() == null || settings.superfreteToken().isBlank()) {
            throw new IllegalStateException("SuperFrete token not configured");
        }

        Map<String, Object> body = Map.of(
            "from", Map.of("postal_code", onlyDigits(settings.originCep())),
            "to", Map.of("postal_code", onlyDigits(command.cep())),
            "services", settings.superfreteServices(),
            "options", Map.of(
                "own_hand", false,
                "receipt", false,
                "insurance_value", 0,
                "use_insurance_value", false
            ),
            "products", List.of(Map.of(
                "quantity", command.itemsCount(),
                "height", settings.packageHeightCm(),
                "length", settings.packageLengthCm(),
                "width", settings.packageWidthCm(),
                "weight", settings.packageWeightKg()
            ))
        );

        List<Map<String, Object>> response = restClient(settings).post()
            .uri("/api/v0/calculator")
            .header("Authorization", "Bearer " + settings.superfreteToken())
            .header("User-Agent", settings.superfreteUserAgent())
            .header("accept", "application/json")
            .header("content-type", "application/json")
            .body(body)
            .retrieve()
            .onStatus(HttpStatusCode::isError, (req, resp) -> {
                throw new IllegalStateException("SuperFrete quote failed: " + resp.getStatusCode());
            })
            .body(List.class);

        if (response == null) return List.of();
        return response.stream()
            .filter(option -> !Boolean.TRUE.equals(option.get("has_error")))
            .map(this::toOption)
            .toList();
    }

    private ShippingQuoteOption toOption(Map<String, Object> option) {
        int id = numberValue(option.get("id")).intValue();
        String name = String.valueOf(option.get("name"));
        BigDecimal price = new BigDecimal(String.valueOf(option.get("price")));
        int days = numberValue(option.get("delivery_time")).intValue();
        return new ShippingQuoteOption(String.valueOf(id), name, price, days);
    }

    private Number numberValue(Object value) {
        return value instanceof Number number ? number : new BigDecimal(String.valueOf(value));
    }

    private RestClient restClient(AdminShippingSettingsValues settings) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(30000);
        return RestClient.builder().requestFactory(factory).baseUrl(settings.superfreteBaseUrl()).build();
    }

    private String onlyDigits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }
}
