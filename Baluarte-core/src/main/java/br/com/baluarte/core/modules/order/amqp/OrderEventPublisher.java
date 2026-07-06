package br.com.baluarte.core.modules.order.amqp;

import br.com.baluarte.core.shared.amqp.BaluarteAmqp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public OrderEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publish(OrderCompletedEvent event) {
        rabbitTemplate.convertAndSend(
            BaluarteAmqp.EXCHANGE,
            BaluarteAmqp.ORDER_COMPLETED,
            event,
            msg -> {
                var props = msg.getMessageProperties();
                props.setMessageId(event.messageId());
                props.setHeader("x-idempotency-key", event.messageId());
                props.setHeader("x-order-id", event.orderId());
                props.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                props.setContentType("application/json");
                return msg;
            }
        );
        log.info("order.completed event=published messageId={} orderId={}",
            event.messageId(), event.orderId());
    }
}
