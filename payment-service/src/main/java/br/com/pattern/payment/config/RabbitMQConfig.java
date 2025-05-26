package br.com.pattern.payment.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Filas e configurações para receber solicitações de pagamento
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
    public static final String PAYMENT_QUEUE = "payment.queue";
    public static final String PAYMENT_ROUTING_KEY = "payment.routing.key";

    // Filas e configurações para enviar resultados de pagamento
    public static final String PAYMENT_RESULT_EXCHANGE = "payment.exchange";
    public static final String PAYMENT_RESULT_QUEUE = "payment.result.queue";
    public static final String PAYMENT_RESULT_ROUTING_KEY = "payment.result.key";
    
    // Fila específica para notificações de pagamento
    public static final String PAYMENT_NOTIFICATION_QUEUE = "payment.notification.queue";
    public static final String PAYMENT_NOTIFICATION_ROUTING_KEY = "payment.notification.key";

    @Bean
    public DirectExchange paymentExchange() {
        return new DirectExchange(PAYMENT_EXCHANGE);
    }

    @Bean
    public Queue paymentQueue() {
        return new Queue(PAYMENT_QUEUE);
    }

    @Bean
    public Binding paymentBinding() {
        return BindingBuilder.bind(paymentQueue())
                .to(paymentExchange())
                .with(PAYMENT_ROUTING_KEY);
    }

    @Bean
    public Queue paymentResultQueue() {
        return new Queue(PAYMENT_RESULT_QUEUE);
    }

    @Bean
    public Binding paymentResultBinding() {
        return BindingBuilder.bind(paymentResultQueue())
                .to(paymentExchange())
                .with(PAYMENT_RESULT_ROUTING_KEY);
    }
    
    @Bean
    public Queue paymentNotificationQueue() {
        return new Queue(PAYMENT_NOTIFICATION_QUEUE);
    }
    
    @Bean
    public Binding paymentNotificationBinding() {
        return BindingBuilder.bind(paymentNotificationQueue())
                .to(paymentExchange())
                .with(PAYMENT_NOTIFICATION_ROUTING_KEY);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        converter.setCreateMessageIds(true);
        rabbitTemplate.setMessageConverter(converter);
        return rabbitTemplate;
    }
} 