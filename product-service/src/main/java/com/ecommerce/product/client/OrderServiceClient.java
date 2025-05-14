package com.ecommerce.product.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderServiceClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${services.order-service.url}")
    private String orderServiceUrl;
    
    public Map<String, Object> getOrderById(String orderId) {
        try {
            String url = orderServiceUrl + "/api/orders/" + orderId;
            log.info("Buscando pedido do serviço de pedidos: {}", url);
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.error("Erro ao buscar pedido {}: {}", orderId, e.getMessage());
            throw new RuntimeException("Erro ao buscar pedido: " + e.getMessage());
        }
    }
    
    public List<Map<String, Object>> getOrderItems(String orderId) {
        try {
            Map<String, Object> order = getOrderById(orderId);
            return (List<Map<String, Object>>) order.get("items");
        } catch (Exception e) {
            log.error("Erro ao buscar itens do pedido {}: {}", orderId, e.getMessage());
            throw new RuntimeException("Erro ao buscar itens do pedido: " + e.getMessage());
        }
    }
} 