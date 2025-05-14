package com.ecommerce.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

//@Configuration
public class GatewayConfig {

    //@Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("product-service", r -> r.path("/api/products/**")
                        .uri("http://product-service:8081"))
                .route("order-service", r -> r.path("/api/orders/**")
                        .uri("http://order-service:8082"))
                .route("payment-service", r -> r.path("/api/payments/**")
                        .uri("http://payment-service:8083"))
                .route("user-service", r -> r.path("/api/users/**", "/api/auth/**")
                        .uri("http://user-service:8084"))
                .route("recommendation-service", r -> r.path("/api/recommendations/**")
                        .uri("http://recommendation-service:5001"))
                .route("logistics-service", r -> r.path("/api/logistics/**")
                        .uri("lb://logistics-service"))
                .build();
    }
} 