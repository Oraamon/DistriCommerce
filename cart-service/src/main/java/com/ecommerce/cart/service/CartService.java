package com.ecommerce.cart.service;

import com.ecommerce.cart.dto.CartItemRequest;
import com.ecommerce.cart.dto.CartResponse;

public interface CartService {
    CartResponse addItemToCart(Long userId, CartItemRequest itemRequest);
    CartResponse getCart(Long userId);
    CartResponse updateItemQuantity(Long userId, Long itemId, Integer quantity);
    CartResponse removeItem(Long userId, Long itemId);
    CartResponse clearCart(Long userId);
} 