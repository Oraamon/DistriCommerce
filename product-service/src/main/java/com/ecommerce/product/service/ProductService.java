package com.ecommerce.product.service;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest productRequest);
    
    ProductResponse getProductById(String id);
    
    List<ProductResponse> getAllProducts();
    
    List<ProductResponse> searchProducts(String query);
    
    List<ProductResponse> getProductsByCategory(String category);
    
    List<ProductResponse> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice);
    
    List<ProductResponse> getRelatedProducts(String productId);
    
    ProductResponse updateProduct(String id, ProductRequest productRequest);
    
    void deleteProduct(String id);
    
    boolean decreaseStock(String productId, int quantity);
    
    boolean increaseStock(String productId, int quantity);
} 