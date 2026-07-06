package br.com.baluarte.core.modules.payment.amqp;

import br.com.baluarte.core.shared.amqp.BaluarteAmqp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * Publica eventos de webhook do Mercado Pago na fila AMQP.
 * Sera ignorado (nenhum bean criado) quando spring.rabbitmq.addresses
 * estiver vazio — nesse caso o controller usa o caminho sincrono.
 */
@Component
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
public class PaymentWebhookPublisher {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookPublisher.class);
    private final RabbitTemplate rabbitTemplate;

    public PaymentWebhookPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publica um evento payment.received no broker.
     * Mensagem persistente com cabecalho de idempotencia.
     */
    public void publish(PaymentWebhookEvent event) {
        rabbitTemplate.convertAndSend(
            BaluarteAmqp.EXCHANGE,
            BaluarteAmqp.PAYMENT_RECEIVED,
            event,
            msg -> {
                var props = msg.getMessageProperties();
                props.setMessageId(event.messageId());
                props.setHeader("x-idempotency-key", event.messageId());
                props.setHeader("x-mercadopago-order-id", event.mercadoPagoOrderId());
                props.setHeader("x-webhook-request-id", event.requestId());
                props.setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                props.setContentType("application/json");
                return msg;
            }
        );
        log.info("payment.webhook event=published messageId={} mpOrderId={}",
            event.messageId(), event.mercadoPagoOrderId());
    }
}
