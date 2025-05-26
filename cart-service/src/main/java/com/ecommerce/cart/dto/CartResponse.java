package com.ecommerce.cart.dto;

import lombok.Data;
import java.util.List;

@Data
public class CartResponse {
    private Long id;
    private Long userId;
    private List<CartItemResponse> items;
    private Double total;
} 