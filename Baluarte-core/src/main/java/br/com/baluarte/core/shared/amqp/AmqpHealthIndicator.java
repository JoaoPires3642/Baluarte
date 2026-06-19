package br.com.baluarte.core.shared.amqp;

import com.rabbitmq.client.Channel;
import org.springframework.amqp.rabbit.connection.Connection;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Health check que abre um canal efemero no broker para validar conectividade.
 * Visivel em /actuator/health com a chave "amqp".
 */
@Component
@ConditionalOnProperty(name = "spring.rabbitmq.addresses")
public class AmqpHealthIndicator implements HealthIndicator {

    private final ConnectionFactory connectionFactory;

    public AmqpHealthIndicator(ConnectionFactory connectionFactory) {
        this.connectionFactory = connectionFactory;
    }

    @Override
    public Health health() {
        try (Connection connection = connectionFactory.createConnection();
             Channel channel = connection.createChannel(false)) {
            return Health.up()
                .withDetail("broker", connectionFactory.toString())
                .build();
        } catch (Exception exception) {
            return Health.down()
                .withDetail("error", exception.getMessage())
                .build();
        }
    }
}
