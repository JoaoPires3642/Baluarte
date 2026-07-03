package br.com.baluarte.core.shared.amqp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URISyntaxException;
import java.time.Duration;

/**
 * Configuracao AMQP para CloudAMQP / LavinMQ.
 * <p>
 * So e ativa quando APP_AMQP_URL esta preenchida. Em ambientes sem AMQP
 * (desenvolvimento local sem fila), nenhum bean e criado e o app sobe
 * normalmente sem tentar conectar.
 */
@Configuration
@ConditionalOnExpression("'${spring.rabbitmq.addresses:}' != ''")
public class AmqpConfig {

    private static final Logger log = LoggerFactory.getLogger(AmqpConfig.class);

    @Bean
    public MessageConverter amqpJsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory amqpListenerContainerFactory(
        ConnectionFactory connectionFactory,
        MessageConverter amqpJsonMessageConverter,
        @Value("${spring.rabbitmq.listener.simple.prefetch:5}") int prefetch
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(amqpJsonMessageConverter);
        factory.setConcurrentConsumers(1);
        factory.setMaxConcurrentConsumers(3);
        factory.setPrefetchCount(prefetch);
        factory.setDefaultRequeueRejected(false);
        factory.setAdviceChain(RetryInterceptorBuilder.stateless()
            .maxRetries(3)
            .backOffOptions(1000, 2.0, 10000)
            .build());
        return factory;
    }

    @Bean
    public RabbitTemplate amqpRabbitTemplate(
        ConnectionFactory connectionFactory,
        MessageConverter amqpJsonMessageConverter
    ) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(amqpJsonMessageConverter);
        template.setMandatory(true);
        return template;
    }

    /**
     * Garante que CachingConnectionFactory use channel caching baixo para
     * respeitar o limite de conexoes do free tier do CloudAMQP.
     */
    @Bean
    public static ConnectionFactory amqpConnectionFactory(
        @Value("${spring.rabbitmq.addresses}") String addresses,
        @Value("${spring.rabbitmq.connection-timeout:10s}") Duration connectionTimeout,
        @Value("${spring.rabbitmq.requested-heartbeat:30s}") Duration heartbeat
    ) {
        CachingConnectionFactory factory = new CachingConnectionFactory();
        try {
            factory.setUri(addresses);
        } catch (URISyntaxException e) {
            log.error("URL AMQP invalida: {}", addresses, e);
            throw new IllegalArgumentException("URL AMQP mal formatada: " + addresses, e);
        }
        factory.setChannelCacheSize(5);
        factory.setConnectionTimeout((int) connectionTimeout.toMillis());
        factory.setRequestedHeartBeat((int) heartbeat.getSeconds());
        return factory;
    }
}
