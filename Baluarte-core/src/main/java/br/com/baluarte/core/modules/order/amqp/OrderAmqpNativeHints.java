package br.com.baluarte.core.modules.order.amqp;

import org.springframework.aot.hint.annotation.RegisterReflectionForBinding;
import org.springframework.context.annotation.Configuration;

@Configuration
@RegisterReflectionForBinding(OrderCompletedEvent.class)
public class OrderAmqpNativeHints {
}
