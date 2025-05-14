package com.ecommerce.order.client;

import com.ecommerce.order.dto.ProductDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.math.BigDecimal;

@FeignClient(name = "product-service")
public interface ProductClient {

    @GetMapping("/api/products/{id}")
    @CircuitBreaker(name = "productService", fallbackMethod = "getDefaultProduct")
    ProductDto getProduct(@PathVariable("id") String id);
    
    @PutMapping("/api/products/{id}/stock")
    @CircuitBreaker(name = "productService", fallbackMethod = "updateStockFallback")
    void updateStock(@PathVariable("id") String id, @RequestParam("quantity") int quantity);
    
    @PostMapping("/api/products/{id}/decrease-stock")
    @CircuitBreaker(name = "productService", fallbackMethod = "updateStockFallback")
    void decreaseStock(@PathVariable("id") String id, @RequestParam("quantity") int quantity);
    
    @PostMapping("/api/products/{id}/increase-stock")
    @CircuitBreaker(name = "productService", fallbackMethod = "updateStockFallback")
    void increaseStock(@PathVariable("id") String id, @RequestParam("quantity") int quantity);
    
    default ProductDto getDefaultProduct(String id, Exception e) {
        return ProductDto.builder()
                .id(id)
                .name("Produto Temporariamente Indisponível")
                .price(BigDecimal.ZERO)
                .build();
    }
    
    default void updateStockFallback(String id, int quantity, Exception e) {
        // Log do erro e possível notificação
        throw new RuntimeException("Falha ao atualizar estoque do produto: " + id);
    }
} 