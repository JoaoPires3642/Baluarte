package br.com.baluarte.core.modules.checkout.amqp;

import org.springframework.aot.hint.annotation.RegisterReflectionForBinding;
import org.springframework.context.annotation.Configuration;

@Configuration
@RegisterReflectionForBinding(ShippingWebhookEvent.class)
public class ShippingAmqpNativeHints {
}
