package br.com.baluarte.core.shared.amqp;

/**
 * Nomeclatura centralizada de exchanges, filas e routing keys do Baluarte.
 *
 * Topologia planejada (vide docs/arquitetura-fila-cloudamqp.md):
 *
 *   baluarte.events (topic exchange)
 *     |- baluarte.payment.events     <- routing key: payment.*
 *     |- baluarte.shipping.events    <- routing key: shipping.*
 *     |- baluarte.order.lifecycle    <- routing key: order.*
 *
 *   baluarte.dlx (direct exchange, dead-letter)
 *     |- baluarte.payment.dlq
 *     |- baluarte.shipping.dlq
 *     |- baluarte.order.dlq
 *
 * As filas principais redirecionam rejeicoes para baluarte.dlx usando o
 * argumento x-dead-letter-exchange.
 */
public final class BaluarteAmqp {

    private BaluarteAmqp() {
    }

    public static final String EXCHANGE = "baluarte.events";
    public static final String DEAD_LETTER_EXCHANGE = "baluarte.dlx";

    public static final String PAYMENT_QUEUE = "baluarte.payment.events";
    public static final String PAYMENT_DLQ = "baluarte.payment.dlq";
    public static final String PAYMENT_ROUTING_KEY = "payment.#";

    public static final String SHIPPING_QUEUE = "baluarte.shipping.events";
    public static final String SHIPPING_DLQ = "baluarte.shipping.dlq";
    public static final String SHIPPING_ROUTING_KEY = "shipping.#";

    public static final String ORDER_QUEUE = "baluarte.order.lifecycle";
    public static final String ORDER_DLQ = "baluarte.order.dlq";
    public static final String ORDER_ROUTING_KEY = "order.#";
}
