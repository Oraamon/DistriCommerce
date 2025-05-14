package com.ecommerce.order.service.impl;

import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.dto.*;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import com.ecommerce.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static com.ecommerce.order.config.RabbitMQConfig.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    private final RabbitTemplate rabbitTemplate;
    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    @Override
    @Transactional
    public OrderResponse createOrder(OrderRequest orderRequest) {
        Order order = new Order();
        order.setUserId(orderRequest.getUserId());
        order.setDeliveryAddress(orderRequest.getDeliveryAddress());
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(orderRequest.getPaymentMethod());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : orderRequest.getItems()) {
            ProductDto product = productClient.getProduct(itemRequest.getProductId());
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setPrice(product.getPrice());
            orderItem.setSubtotal(product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            
            orderItems.add(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);

        // Atualizar estoque dos produtos
        for (OrderItem item : orderItems) {
            try {
                productClient.updateStock(item.getProductId(), -item.getQuantity());
                log.info("Estoque atualizado para produto: {}, quantidade: {}", 
                    item.getProductId(), -item.getQuantity());
            } catch (Exception e) {
                log.error("Erro ao atualizar estoque do produto: {}", item.getProductId(), e);
                throw new RuntimeException("Erro ao atualizar estoque do produto: " + item.getProductId());
            }
        }

        // Envia o pedido para processamento de pagamento
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId(savedOrder.getId())
                .userId(savedOrder.getUserId())
                .amount(savedOrder.getTotalAmount())
                .paymentMethod(savedOrder.getPaymentMethod())
                .build();

        rabbitTemplate.convertAndSend(PAYMENT_EXCHANGE, PAYMENT_ROUTING_KEY, paymentRequest);

        return mapToOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponse createSimpleOrder(OrderRequest orderRequest) {
        log.info("Criando pedido simplificado para usuário: {}", orderRequest.getUserId());
        
        Order order = new Order();
        order.setUserId(orderRequest.getUserId());
        order.setDeliveryAddress(orderRequest.getDeliveryAddress());
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(orderRequest.getPaymentMethod());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Para cada item, definimos um preço fixo simplificado
        for (OrderItemRequest itemRequest : orderRequest.getItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(itemRequest.getProductId());
            orderItem.setProductName("Produto " + itemRequest.getProductId()); // Nome genérico
            orderItem.setQuantity(itemRequest.getQuantity());
            
            // Criamos um preço fictício para simplificar
            BigDecimal unitPrice = new BigDecimal("99.99");
            orderItem.setPrice(unitPrice);
            orderItem.setSubtotal(unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            
            orderItems.add(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());
        }

        order.setItems(orderItems);
        order.setTotalAmount(totalAmount);
        
        log.info("Salvando pedido simplificado com {} itens", orderItems.size());
        Order savedOrder = orderRepository.save(order);
        log.info("Pedido simplificado salvo com ID: {}", savedOrder.getId());

        // Não atualizamos o estoque nem enviamos para processamento de pagamento
        // para manter o processo simples e independente de outros serviços

        return mapToOrderResponse(savedOrder);
    }

    @Override
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado com id: " + id));
        return mapToOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getOrdersByUserId(String userId) {
        try {
            log.info("Buscando pedidos para o usuário: {}", userId);
            
            if (userId == null || userId.isEmpty()) {
                log.error("ID do usuário não informado");
                throw new IllegalArgumentException("ID do usuário não pode ser nulo ou vazio");
            }
            
            List<Order> orders = orderRepository.findByUserId(userId);
            log.info("Encontrados {} pedidos para o usuário {}", orders.size(), userId);
            
            return orders.stream()
                    .map(this::mapToOrderResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar pedidos para o usuário {}: {}", userId, e.getMessage());
            throw new RuntimeException("Erro ao buscar pedidos para o usuário: " + userId, e);
        }
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado com id: " + id));
        
        order.setStatus(status);
        
        Order updatedOrder = orderRepository.save(order);
        return mapToOrderResponse(updatedOrder);
    }

    @Override
    @Transactional
    public OrderResponse updateTrackingInfo(Long id, String trackingNumber) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado com id: " + id));
        
        order.setTrackingNumber(trackingNumber);
        order.setStatus(OrderStatus.SHIPPED);
        
        Order updatedOrder = orderRepository.save(order);
        return mapToOrderResponse(updatedOrder);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> orderItemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .totalAmount(order.getTotalAmount())
                .items(orderItemResponses)
                .deliveryAddress(order.getDeliveryAddress())
                .trackingNumber(order.getTrackingNumber())
                .paymentId(order.getPaymentId())
                .paymentMethod(order.getPaymentMethod())
                .build();
    }
} 