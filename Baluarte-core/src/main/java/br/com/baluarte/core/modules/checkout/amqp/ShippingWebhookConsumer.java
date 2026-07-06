package br.com.baluarte.core.modules.checkout.amqp;

import br.com.baluarte.core.modules.checkout.application.SuperFreteWebhookService;
import br.com.baluarte.core.shared.amqp.BaluarteAmqp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
public class ShippingWebhookConsumer {

    private static final Logger log = LoggerFactory.getLogger(ShippingWebhookConsumer.class);

    private final SuperFreteWebhookService service;

    public ShippingWebhookConsumer(SuperFreteWebhookService service) {
        this.service = service;
    }

    @RabbitListener(
        queues = BaluarteAmqp.SHIPPING_QUEUE,
        containerFactory = "amqpListenerContainerFactory"
    )
    public void onShippingEvent(ShippingWebhookEvent event) {
        log.info("shipping.webhook event=received messageId={}", event.messageId());
        service.process(event.rawBody());
        log.info("shipping.webhook event=processed messageId={}", event.messageId());
    }
}
