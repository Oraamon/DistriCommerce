package com.ecommerce.product.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;

@Data
@Document(collection = "products")
public class Product {

    @Id
    private String id;
    
    @Indexed
    private String name;
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private int quantity;

    public Product() {}

    public Product(String name, String description, BigDecimal price, String imageUrl, int quantity) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.quantity = quantity;
    }
}