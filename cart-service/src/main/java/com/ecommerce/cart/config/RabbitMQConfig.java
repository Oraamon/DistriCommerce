package com.ecommerce.cart.config;

import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String CART_EXCHANGE = "cart.exchange";
    public static final String CART_ROUTING_KEY = "cart.routing.key";
    public static final String CART_QUEUE = "cart.queue";

    @Bean
    public DirectExchange cartExchange() {
        return new DirectExchange(CART_EXCHANGE);
    }

    @Bean
    public Queue cartQueue() {
        return new Queue(CART_QUEUE);
    }

    @Bean
    public Binding cartBinding() {
        return BindingBuilder
                .bind(cartQueue())
                .to(cartExchange())
                .with(CART_ROUTING_KEY);
    }
} 