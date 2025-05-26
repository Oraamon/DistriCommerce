package com.ecommerce.order.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Exchanges
    public static final String ORDER_EXCHANGE = "order.exchange";
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";
    public static final String ORDER_NOTIFICATION_EXCHANGE = "order.notification.exchange";
    
    // Queues
    public static final String ORDER_QUEUE = "order.queue";
    public static final String PAYMENT_QUEUE = "payment.queue";
    public static final String ORDER_NOTIFICATION_QUEUE = "order.notification.queue";
    public static final String PAYMENT_RESULT_QUEUE = "payment.result.queue";
    
    // Routing Keys
    public static final String ORDER_ROUTING_KEY = "order.key";
    public static final String PAYMENT_ROUTING_KEY = "payment.key";
    public static final String ORDER_NOTIFICATION_ROUTING_KEY = "order.notification.key";
    public static final String PAYMENT_RESULT_ROUTING_KEY = "payment.result.key";
    
    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(ORDER_EXCHANGE);
    }
    
    @Bean
    public DirectExchange paymentExchange() {
        return new DirectExchange(PAYMENT_EXCHANGE);
    }
    
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(NOTIFICATION_EXCHANGE);
    }
    
    @Bean
    public DirectExchange orderNotificationExchange() {
        return new DirectExchange(ORDER_NOTIFICATION_EXCHANGE);
    }
    
    @Bean
    public Queue orderQueue() {
        return new Queue(ORDER_QUEUE);
    }
    
    @Bean
    public Queue paymentQueue() {
        return new Queue(PAYMENT_QUEUE);
    }
    
    @Bean
    public Queue orderNotificationQueue() {
        return new Queue(ORDER_NOTIFICATION_QUEUE);
    }
    
    @Bean
    public Queue paymentResultQueue() {
        return new Queue(PAYMENT_RESULT_QUEUE);
    }
    
    @Bean
    public Binding orderBinding() {
        return BindingBuilder
                .bind(orderQueue())
                .to(orderExchange())
                .with(ORDER_ROUTING_KEY);
    }
    
    @Bean
    public Binding paymentBinding() {
        return BindingBuilder
                .bind(paymentQueue())
                .to(paymentExchange())
                .with(PAYMENT_ROUTING_KEY);
    }
    
    @Bean
    public Binding orderNotificationBinding() {
        return BindingBuilder
                .bind(orderNotificationQueue())
                .to(orderNotificationExchange())
                .with(ORDER_NOTIFICATION_ROUTING_KEY);
    }
    
    @Bean
    public Binding paymentResultBinding() {
        return BindingBuilder
                .bind(paymentResultQueue())
                .to(paymentExchange())
                .with(PAYMENT_RESULT_ROUTING_KEY);
    }
    
    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
    
    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter());
        return rabbitTemplate;
    }
} 