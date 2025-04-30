package com.ecommerce.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("product-service", r -> r.path("/api/products/**")
                        .uri("lb://product-service"))
                .route("order-service", r -> r.path("/api/orders/**")
                        .uri("lb://order-service"))
                .route("payment-service", r -> r.path("/api/payments/**")
                        .uri("lb://payment-service"))
                .route("user-service", r -> r.path("/api/users/**", "/api/auth/**")
                        .uri("lb://user-service"))
                .route("recommendation-service", r -> r.path("/api/recommendations/**")
                        .uri("lb://recommendation-service"))
                .route("logistics-service", r -> r.path("/api/logistics/**")
                        .uri("lb://logistics-service"))
                .build();
    }
} 