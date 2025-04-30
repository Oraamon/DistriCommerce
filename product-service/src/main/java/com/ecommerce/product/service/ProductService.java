package com.ecommerce.product.service;

import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;

import java.util.List;

public interface ProductService {

    ProductResponse createProduct(ProductRequest productRequest);
    
    ProductResponse getProductById(String id);
    
    List<ProductResponse> getAllProducts();
    
    List<ProductResponse> searchProducts(String query);
    
    List<ProductResponse> getProductsByCategory(String category);
    
    ProductResponse updateProduct(String id, ProductRequest productRequest);
    
    void deleteProduct(String id);
} 