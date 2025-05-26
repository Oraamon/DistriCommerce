package com.ecommerce.cart.controller;

import com.ecommerce.cart.dto.CartItemRequest;
import com.ecommerce.cart.dto.CartResponse;
import com.ecommerce.cart.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(@RequestHeader("X-User-Id") Long userId) {
        log.info("Buscando carrinho para usuário: {}", userId);
        CartResponse cart = cartService.getCart(userId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/add")
    public ResponseEntity<CartResponse> addItem(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody CartItemRequest itemRequest) {
        log.info("Adicionando item ao carrinho - Usuário: {}, Produto: {}, Quantidade: {}", 
                userId, itemRequest.getProductId(), itemRequest.getQuantity());
        CartResponse cart = cartService.addItemToCart(userId, itemRequest);
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<CartResponse> updateItemQuantity(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long itemId,
            @RequestBody CartItemRequest itemRequest) {
        log.info("Atualizando quantidade do item {} para usuário {}: {}", 
                itemId, userId, itemRequest.getQuantity());
        CartResponse cart = cartService.updateItemQuantity(userId, itemId, itemRequest.getQuantity());
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<CartResponse> removeItem(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long itemId) {
        log.info("Removendo item {} do carrinho do usuário {}", itemId, userId);
        CartResponse cart = cartService.removeItem(userId, itemId);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<CartResponse> clearCart(@RequestHeader("X-User-Id") Long userId) {
        log.info("Limpando carrinho do usuário {}", userId);
        CartResponse cart = cartService.clearCart(userId);
        return ResponseEntity.ok(cart);
    }
} 