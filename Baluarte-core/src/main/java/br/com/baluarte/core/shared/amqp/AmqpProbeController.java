package br.com.baluarte.core.shared.amqp;

import br.com.baluarte.core.shared.auth.AdminAuthFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoint administrativo para validar conectividade com o CloudAMQP.
 *
 * GET /api/v1/admin/amqp/probe
 *   - publica uma mensagem de teste em baluarte.events com routing key "probe"
 *   - retorna 200 com message id e timestamp se ack do broker chegou
 *
 * Exige admin (passa pelo AdminAuthFilter). Nao tem fila vinculada a
 * routing key "probe", entao a mensagem vai para DLQ ou descartada
 * (mandatory=true retorna para o caller se nao houver queue).
 */
@RestController
@RequestMapping("/api/v1/admin/amqp")
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
public class AmqpProbeController {

    private static final Logger log = LoggerFactory.getLogger(AmqpProbeController.class);

    private final RabbitTemplate rabbitTemplate;

    public AmqpProbeController(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    @GetMapping("/probe")
    public Map<String, Object> probe(
        @RequestHeader(AdminAuthFilter.USER_ID_HEADER) String userId,
        @RequestHeader(AdminAuthFilter.USER_EMAIL_HEADER) String userEmail
    ) {
        String messageId = UUID.randomUUID().toString();
        Map<String, Object> payload = Map.of(
            "id", messageId,
            "type", "amqp.probe",
            "userId", userId,
            "email", userEmail,
            "publishedAt", Instant.now().toString()
        );

        try {
            rabbitTemplate.convertAndSend(
                BaluarteAmqp.EXCHANGE,
                "probe",
                payload
            );
            log.info("amqp.probe event=published messageId={} user={}", messageId, userEmail);
            return Map.of(
                "status", "published",
                "messageId", messageId,
                "exchange", BaluarteAmqp.EXCHANGE,
                "routingKey", "probe"
            );
        } catch (Exception exception) {
            log.warn("amqp.probe event=publish_failed messageId={} reason={}", messageId, exception.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Falha ao publicar no AMQP: " + exception.getMessage());
        }
    }
}
