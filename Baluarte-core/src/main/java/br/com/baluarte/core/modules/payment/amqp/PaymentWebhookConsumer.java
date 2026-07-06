package br.com.baluarte.core.modules.payment.amqp;

import br.com.baluarte.core.modules.payment.application.MercadoPagoWebhookService;
import br.com.baluarte.core.shared.amqp.BaluarteAmqp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * Consome eventos de webhook do Mercado Pago da fila AMQP.
 * Sera ignorado quando spring.rabbitmq.addresses estiver vazio.
 *
 * A desserializacao JSON e automatica (Jackson2JsonMessageConverter do
 * amqpListenerContainerFactory). O ack/nack e tratado pelo container
 * (acknowledge-mode: auto + retry interceptor com DLX).
 * Se o processamento lancar excecao, o retry interceptor re-tenta ate
 * 3 vezes com backoff; esgotadas as tentativas a mensagem vai para DLQ.
 */
@Component
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
public class PaymentWebhookConsumer {

    private static final Logger log = LoggerFactory.getLogger(PaymentWebhookConsumer.class);

    private final MercadoPagoWebhookService service;

    public PaymentWebhookConsumer(MercadoPagoWebhookService service) {
        this.service = service;
    }

    @RabbitListener(
        queues = BaluarteAmqp.PAYMENT_QUEUE,
        containerFactory = "amqpListenerContainerFactory"
    )
    public void onPaymentReceived(PaymentWebhookEvent event) {
        log.info("payment.webhook event=received messageId={} mpOrderId={}",
            event.messageId(), event.mercadoPagoOrderId());

        service.process(event.mercadoPagoOrderId());

        log.info("payment.webhook event=processed messageId={} mpOrderId={}",
            event.messageId(), event.mercadoPagoOrderId());
    }
}
