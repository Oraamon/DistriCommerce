package com.ecommerce.product.service.impl;

import com.ecommerce.product.client.OrderServiceClient;
import com.ecommerce.product.service.ProductService;
import com.ecommerce.product.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockServiceImpl implements StockService {

    private final ProductService productService;
    private final OrderServiceClient orderServiceClient;

    @Override
    public void processCompletedPayment(String orderId) {
        log.info("Processando pagamento concluído para o pedido: {}", orderId);
        try {
            List<Map<String, Object>> orderItems = orderServiceClient.getOrderItems(orderId);
            
            if (orderItems == null || orderItems.isEmpty()) {
                log.warn("Nenhum item encontrado para o pedido: {}", orderId);
                return;
            }
            
            for (Map<String, Object> item : orderItems) {
                String productId = (String) item.get("productId");
                Integer quantity = (Integer) item.get("quantity");
                
                if (productId != null && quantity != null) {
                    log.info("Diminuindo estoque para o produto {} em {} unidades", productId, quantity);
                    productService.decreaseStock(productId, quantity);
                }
            }
            
            log.info("Estoque atualizado com sucesso para o pedido: {}", orderId);
        } catch (Exception e) {
            log.error("Erro ao processar pagamento concluído para o pedido {}: {}", orderId, e.getMessage());
        }
    }

    @Override
    public void processFailedPayment(String orderId) {
        log.info("Processando pagamento falho para o pedido: {}", orderId);
        // Se o pagamento falhou, não precisamos fazer nada, pois o estoque não foi ajustado
    }

    @Override
    public void processRefundedPayment(String orderId) {
        log.info("Processando reembolso para o pedido: {}", orderId);
        try {
            List<Map<String, Object>> orderItems = orderServiceClient.getOrderItems(orderId);
            
            if (orderItems == null || orderItems.isEmpty()) {
                log.warn("Nenhum item encontrado para o pedido: {}", orderId);
                return;
            }
            
            for (Map<String, Object> item : orderItems) {
                String productId = (String) item.get("productId");
                Integer quantity = (Integer) item.get("quantity");
                
                if (productId != null && quantity != null) {
                    log.info("Aumentando estoque para o produto {} em {} unidades", productId, quantity);
                    productService.increaseStock(productId, quantity);
                }
            }
            
            log.info("Estoque atualizado com sucesso para o pedido reembolsado: {}", orderId);
        } catch (Exception e) {
            log.error("Erro ao processar reembolso para o pedido {}: {}", orderId, e.getMessage());
        }
    }
} 