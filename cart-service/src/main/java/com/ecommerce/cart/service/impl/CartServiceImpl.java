package com.ecommerce.cart.service.impl;

import com.ecommerce.cart.config.RabbitMQConfig;
import com.ecommerce.cart.dto.CartItemRequest;
import com.ecommerce.cart.dto.CartItemResponse;
import com.ecommerce.cart.dto.CartResponse;
import com.ecommerce.cart.model.Cart;
import com.ecommerce.cart.model.CartItem;
import com.ecommerce.cart.repository.CartRepository;
import com.ecommerce.cart.service.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.ecommerce.cart.config.RabbitMQConfig.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final RabbitTemplate rabbitTemplate;

    @Override
    @Transactional
    public CartResponse addItemToCart(Long userId, CartItemRequest itemRequest) {
        Cart cart = getOrCreateUniqueCart(userId);

        CartItem cartItem = new CartItem();
        cartItem.setCart(cart);
        cartItem.setProductId(itemRequest.getProductId());
        cartItem.setQuantity(itemRequest.getQuantity());
        cartItem.setPrice(itemRequest.getPrice());

        cart.getItems().add(cartItem);
        cart = cartRepository.save(cart);

        sendCartNotification("item_added", userId.toString(), itemRequest.getProductId(), itemRequest.getQuantity());
        return convertToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateUniqueCart(userId);
        return convertToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateItemQuantity(Long userId, Long itemId, Integer quantity) {
        Cart cart = getOrCreateUniqueCart(userId);

        cart.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .ifPresent(item -> item.setQuantity(quantity));

        cart = cartRepository.save(cart);
        sendCartNotification("item_updated", userId.toString(), itemId.toString(), quantity);
        return convertToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeItem(Long userId, Long itemId) {
        Cart cart = getOrCreateUniqueCart(userId);

        cart.getItems().removeIf(item -> item.getId().equals(itemId));
        cart = cartRepository.save(cart);

        sendCartNotification("item_removed", userId.toString(), itemId.toString(), 0);
        return convertToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse clearCart(Long userId) {
        Cart cart = getOrCreateUniqueCart(userId);

        cart.getItems().clear();
        cart = cartRepository.save(cart);

        sendCartNotification("cart_cleared", userId.toString(), null, 0);
        return convertToCartResponse(cart);
    }

    private CartResponse convertToCartResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::convertToCartItemResponse)
                .collect(Collectors.toList());

        double total = items.stream()
                .mapToDouble(CartItemResponse::getSubtotal)
                .sum();

        CartResponse response = new CartResponse();
        response.setId(cart.getId());
        response.setUserId(cart.getUserId());
        response.setItems(items);
        response.setTotal(total);

        return response;
    }

    private CartItemResponse convertToCartItemResponse(CartItem item) {
        CartItemResponse response = new CartItemResponse();
        response.setId(item.getId());
        response.setProductId(item.getProductId());
        response.setQuantity(item.getQuantity());
        response.setPrice(item.getPrice());
        response.setSubtotal(item.getPrice() * item.getQuantity());
        return response;
    }

    private Cart getOrCreateUniqueCart(Long userId) {
        List<Cart> carts = cartRepository.findAllByUserId(userId);
        
        if (carts.isEmpty()) {
            // Criar novo carrinho se não existir
            Cart newCart = new Cart();
            newCart.setUserId(userId);
            return cartRepository.save(newCart);
        } else if (carts.size() == 1) {
            // Retornar o único carrinho
            return carts.get(0);
        } else {
            // Múltiplos carrinhos encontrados - consolidar
            log.warn("Múltiplos carrinhos encontrados para usuário {}. Consolidando...", userId);
            
            Cart mainCart = carts.get(0); // Manter o primeiro
            
            // Mover todos os itens dos outros carrinhos para o principal
            for (int i = 1; i < carts.size(); i++) {
                Cart duplicateCart = carts.get(i);
                for (CartItem item : duplicateCart.getItems()) {
                    item.setCart(mainCart);
                    mainCart.getItems().add(item);
                }
                // Deletar carrinho duplicado
                cartRepository.delete(duplicateCart);
            }
            
            // Salvar carrinho principal com todos os itens
            return cartRepository.save(mainCart);
        }
    }

    private void sendCartNotification(String action, String userId, String productId, int quantity) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("action", action);
            notification.put("userId", userId);
            notification.put("productId", productId);
            notification.put("quantity", quantity);
            notification.put("timestamp", System.currentTimeMillis());

            rabbitTemplate.convertAndSend(
                CART_EXCHANGE,
                CART_ROUTING_KEY,
                notification
            );

            log.info("Notificação de carrinho enviada: {} para usuário {}", action, userId);
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de carrinho: {}", e.getMessage());
        }
    }
} 