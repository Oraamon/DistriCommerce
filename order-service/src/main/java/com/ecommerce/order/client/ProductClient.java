package com.ecommerce.order.client;

import com.ecommerce.order.dto.ProductDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "product-service")
public interface ProductClient {

    @GetMapping("/api/products/{id}")
    @CircuitBreaker(name = "productService", fallbackMethod = "getDefaultProduct")
    ProductDto getProduct(@PathVariable("id") String id);
    
    default ProductDto getDefaultProduct(String id, Exception e) {
        return ProductDto.builder()
                .id(id)
                .name("Produto Temporariamente Indisponível")
                .price(0.0)
                .build();
    }
} 