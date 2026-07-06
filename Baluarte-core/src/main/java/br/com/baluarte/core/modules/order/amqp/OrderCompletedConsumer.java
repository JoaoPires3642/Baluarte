package br.com.baluarte.core.modules.order.amqp;

import br.com.baluarte.core.modules.payment.domain.CheckoutOrder;
import br.com.baluarte.core.modules.payment.domain.CheckoutOrderRepository;
import br.com.baluarte.core.shared.amqp.BaluarteAmqp;
import br.com.baluarte.core.shared.mail.EmailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
public class OrderCompletedConsumer {

    private static final Logger log = LoggerFactory.getLogger(OrderCompletedConsumer.class);

    private final CheckoutOrderRepository orderRepository;
    private final EmailSender emailSender;

    public OrderCompletedConsumer(
        CheckoutOrderRepository orderRepository,
        @Autowired(required = false) EmailSender emailSender
    ) {
        this.orderRepository = orderRepository;
        this.emailSender = emailSender;
    }

    @RabbitListener(
        queues = BaluarteAmqp.ORDER_QUEUE,
        containerFactory = "amqpListenerContainerFactory"
    )
    public void onOrderCompleted(OrderCompletedEvent event) {
        log.info("order.completed event=received orderId={}", event.orderId());

        CheckoutOrder order = orderRepository.findById(event.orderId())
            .orElse(null);

        if (order == null) {
            log.warn("order.completed event=order_not_found orderId={}", event.orderId());
            return;
        }

        if (emailSender != null) {
            try {
                emailSender.sendOrderConfirmation(event, order);
                log.info("order.completed email=sent orderId={}", event.orderId());
            } catch (Exception e) {
                log.warn("order.completed email=failed orderId={} reason={}",
                    event.orderId(), e.getMessage());
            }
        }

        log.info("order.completed event=processed orderId={}", event.orderId());
    }
}
