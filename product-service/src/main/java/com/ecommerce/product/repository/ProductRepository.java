package com.ecommerce.product.repository;

import com.ecommerce.product.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {

    List<Product> findByNameContainingIgnoreCase(String name);
    
    List<Product> findByCategoriesContaining(String category);
    
    @Query("{'price': {$gte: ?0, $lte: ?1}}")
    List<Product> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice);
    
    @Query(value = "{'categories': {$in: ?0}}", fields = "{'id': 1, 'name': 1, 'price': 1, 'images': 1}")
    List<Product> findRelatedProducts(List<String> categories);
} 