package com.ecommerce.cart.dto;

import lombok.Data;

@Data
public class CartItemResponse {
    private Long id;
    private String productId;
    private Integer quantity;
    private Double price;
    private Double subtotal;
} 