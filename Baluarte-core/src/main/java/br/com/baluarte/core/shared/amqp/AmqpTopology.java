package br.com.baluarte.core.shared.amqp;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Declara a topologia completa de filas/exchanges/DLQ no broker.
 * Idempotente: se as filas ja existirem, o Spring so redeclara se forem
 * iguais (caso contrario o broker rejeita e o app falha ao subir).
 */
@Configuration
@ConditionalOnProperty(name = "spring.rabbitmq.addresses")
public class AmqpTopology {

    @Bean
    public TopicExchange baluarteEventsExchange() {
        return new TopicExchange(BaluarteAmqp.EXCHANGE, true, false);
    }

    @Bean
    public DirectExchange baluarteDlExchange() {
        return new DirectExchange(BaluarteAmqp.DEAD_LETTER_EXCHANGE, true, false);
    }

    private Queue durableWithDlx(String name) {
        return QueueBuilder.durable(name)
            .withArguments(Map.of(
                "x-dead-letter-exchange", BaluarteAmqp.DEAD_LETTER_EXCHANGE,
                "x-dead-letter-routing-key", name + ".dlq"
            ))
            .build();
    }

    @Bean
    public Queue paymentQueue() {
        return durableWithDlx(BaluarteAmqp.PAYMENT_QUEUE);
    }

    @Bean
    public Queue shippingQueue() {
        return durableWithDlx(BaluarteAmqp.SHIPPING_QUEUE);
    }

    @Bean
    public Queue orderQueue() {
        return durableWithDlx(BaluarteAmqp.ORDER_QUEUE);
    }

    @Bean
    public Queue paymentDlq() {
        return QueueBuilder.durable(BaluarteAmqp.PAYMENT_DLQ).build();
    }

    @Bean
    public Queue shippingDlq() {
        return QueueBuilder.durable(BaluarteAmqp.SHIPPING_DLQ).build();
    }

    @Bean
    public Queue orderDlq() {
        return QueueBuilder.durable(BaluarteAmqp.ORDER_DLQ).build();
    }

    @Bean
    public Binding paymentBinding() {
        return BindingBuilder.bind(paymentQueue())
            .to(baluarteEventsExchange())
            .with(BaluarteAmqp.PAYMENT_ROUTING_KEY);
    }

    @Bean
    public Binding shippingBinding() {
        return BindingBuilder.bind(shippingQueue())
            .to(baluarteEventsExchange())
            .with(BaluarteAmqp.SHIPPING_ROUTING_KEY);
    }

    @Bean
    public Binding orderBinding() {
        return BindingBuilder.bind(orderQueue())
            .to(baluarteEventsExchange())
            .with(BaluarteAmqp.ORDER_ROUTING_KEY);
    }

    @Bean
    public Binding paymentDlqBinding() {
        return BindingBuilder.bind(paymentDlq())
            .to(baluarteDlExchange())
            .with(BaluarteAmqp.PAYMENT_QUEUE + ".dlq");
    }

    @Bean
    public Binding shippingDlqBinding() {
        return BindingBuilder.bind(shippingDlq())
            .to(baluarteDlExchange())
            .with(BaluarteAmqp.SHIPPING_QUEUE + ".dlq");
    }

    @Bean
    public Binding orderDlqBinding() {
        return BindingBuilder.bind(orderDlq())
            .to(baluarteDlExchange())
            .with(BaluarteAmqp.ORDER_QUEUE + ".dlq");
    }
}
