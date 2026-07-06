package br.com.baluarte.core.modules.checkout.amqp;

import br.com.baluarte.core.shared.amqp.BaluarteAmqp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
public class ShippingWebhookPublisher {

    private static final Logger log = LoggerFactory.getLogger(ShippingWebhookPublisher.class);
    private static final String ROUTING_KEY = "shipping.label.generated";

    private final RabbitTemplate rabbitTemplate;

    public ShippingWebhookPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(ShippingWebhookEvent event) {
        rabbitTemplate.convertAndSend(
            BaluarteAmqp.EXCHANGE,
            ROUTING_KEY,
            event,
            msg -> {
                var props = msg.getMessageProperties();
                props.setMessageId(event.messageId());
                props.setHeader("x-idempotency-key", event.messageId());
                props.setHeader("x-webhook-request-id", event.requestId());
                props.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                props.setContentType("application/json");
                return msg;
            }
        );
        log.info("shipping.webhook event=published messageId={}", event.messageId());
    }
}
