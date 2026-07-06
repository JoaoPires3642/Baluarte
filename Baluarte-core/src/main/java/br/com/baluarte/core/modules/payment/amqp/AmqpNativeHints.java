package br.com.baluarte.core.modules.payment.amqp;

import org.springframework.aot.hint.annotation.RegisterReflectionForBinding;
import org.springframework.context.annotation.Configuration;

/**
 * Hints de reflexao para native-image (GraalVM).
 * Garante que os POJOs de mensagem AMQP sejam acessiveis em runtime AOT.
 */
@Configuration
@RegisterReflectionForBinding(PaymentWebhookEvent.class)
public class AmqpNativeHints {
}
