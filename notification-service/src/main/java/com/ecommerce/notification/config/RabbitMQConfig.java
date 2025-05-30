package com.ecommerce.notification.config;

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
    public static final String NOTIFICATION_EXCHANGE = "notification.exchange";
    public static final String CART_NOTIFICATION_EXCHANGE = "cart.notification.exchange";
    public static final String ORDER_NOTIFICATION_EXCHANGE = "order.notification.exchange";
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
    
    // Queues
    public static final String NOTIFICATION_QUEUE = "notification.queue";
    public static final String CART_NOTIFICATION_QUEUE = "cart.notification.queue";
    public static final String ORDER_NOTIFICATION_QUEUE = "order.notification.queue";
    public static final String CART_QUEUE = "cart.queue";
    public static final String ORDER_QUEUE = "order.notification.queue";
    public static final String PAYMENT_NOTIFICATION_QUEUE = "payment.notification.queue";
    
    // Routing Keys
    public static final String NOTIFICATION_ROUTING_KEY = "notification.key";
    public static final String CART_NOTIFICATION_ROUTING_KEY = "cart.notification.key";
    public static final String ORDER_NOTIFICATION_ROUTING_KEY = "order.notification.key";
    public static final String PAYMENT_NOTIFICATION_ROUTING_KEY = "payment.notification.key";
    
    @Bean
    public TopicExchange notificationExchange() {
        return new TopicExchange(NOTIFICATION_EXCHANGE);
    }
    
    @Bean
    public TopicExchange cartNotificationExchange() {
        return new TopicExchange(CART_NOTIFICATION_EXCHANGE);
    }
    
    @Bean
    public DirectExchange orderNotificationExchange() {
        return new DirectExchange(ORDER_NOTIFICATION_EXCHANGE);
    }
    
    @Bean
    public DirectExchange paymentExchange() {
        return new DirectExchange(PAYMENT_EXCHANGE);
    }
    
    @Bean
    public Queue notificationQueue() {
        return new Queue(NOTIFICATION_QUEUE);
    }
    
    @Bean
    public Queue cartNotificationQueue() {
        return new Queue(CART_NOTIFICATION_QUEUE);
    }
    
    @Bean
    public Queue orderNotificationQueue() {
        return new Queue(ORDER_NOTIFICATION_QUEUE);
    }
    
    @Bean
    public Queue cartQueue() {
        return new Queue(CART_QUEUE);
    }
    
    @Bean
    public Queue orderQueue() {
        return new Queue(ORDER_QUEUE);
    }
    
    @Bean
    public Queue paymentNotificationQueue() {
        return new Queue(PAYMENT_NOTIFICATION_QUEUE);
    }
    

    
    @Bean
    public Binding notificationBinding() {
        return BindingBuilder
                .bind(notificationQueue())
                .to(notificationExchange())
                .with(NOTIFICATION_ROUTING_KEY);
    }
    
    @Bean
    public Binding cartNotificationBinding() {
        return BindingBuilder
                .bind(cartNotificationQueue())
                .to(cartNotificationExchange())
                .with(CART_NOTIFICATION_ROUTING_KEY);
    }
    
    @Bean
    public Binding orderNotificationBinding() {
        return BindingBuilder
                .bind(orderNotificationQueue())
                .to(orderNotificationExchange())
                .with(ORDER_NOTIFICATION_ROUTING_KEY);
    }
    
    @Bean
    public Binding paymentNotificationBinding() {
        return BindingBuilder
                .bind(paymentNotificationQueue())
                .to(paymentExchange())
                .with(PAYMENT_NOTIFICATION_ROUTING_KEY);
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
    
    @Bean
    public org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory stringListenerContainerFactory(ConnectionFactory connectionFactory) {
        org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory factory = new org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(new org.springframework.amqp.support.converter.SimpleMessageConverter());
        return factory;
    }
} 