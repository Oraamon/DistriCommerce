package com.ecommerce.order.service.impl;

import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.dto.*;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import com.ecommerce.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;

import static com.ecommerce.order.config.RabbitMQConfig.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private static final Logger log = LoggerFactory.getLogger(OrderServiceImpl.class);

    public OrderServiceImpl(OrderRepository orderRepository, ProductClient productClient, 
                            RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.productClient = productClient;
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

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
                try {
                    productClient.updateStock(item.getProductId(), -item.getQuantity());
                    log.info("Estoque atualizado para produto: {}, quantidade: {}", 
                        item.getProductId(), -item.getQuantity());
                } catch (Exception e) {
                    log.warn("Falha ao atualizar estoque via endpoint principal, tentando endpoint alternativo: {}", e.getMessage());
                    // Tentar com endpoint alternativo
                    productClient.decreaseStock(item.getProductId(), item.getQuantity());
                    log.info("Estoque atualizado para produto via endpoint alternativo: {}, quantidade: {}", 
                        item.getProductId(), item.getQuantity());
                }
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

        // Busca os detalhes reais do produto para cada item
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
        
        log.info("Salvando pedido simplificado com {} itens", orderItems.size());
        Order savedOrder = orderRepository.save(order);
        log.info("Pedido simplificado salvo com ID: {}", savedOrder.getId());

        // Atualizar estoque dos produtos
        for (OrderItem item : orderItems) {
            try {
                try {
                    productClient.updateStock(item.getProductId(), -item.getQuantity());
                    log.info("Estoque atualizado para produto em pedido simplificado: {}, quantidade: {}", 
                        item.getProductId(), -item.getQuantity());
                } catch (Exception e) {
                    log.warn("Falha ao atualizar estoque via endpoint principal (pedido simplificado), tentando endpoint alternativo: {}", e.getMessage());
                    // Tentar com endpoint alternativo
                    productClient.decreaseStock(item.getProductId(), item.getQuantity());
                    log.info("Estoque atualizado para produto via endpoint alternativo (pedido simplificado): {}, quantidade: {}", 
                        item.getProductId(), item.getQuantity());
                }
            } catch (Exception e) {
                log.error("Erro ao atualizar estoque do produto (pedido simplificado): {}", item.getProductId(), e);
                // Log do erro mas não interrompe o processo para manter compatibilidade com implementação anterior
                // Pode ser melhorado para lançar exceção se necessário
            }
        }

        // Envia o pedido para processamento de pagamento
        PaymentRequest paymentRequest = PaymentRequest.builder()
                .orderId(savedOrder.getId())
                .userId(savedOrder.getUserId())
                .amount(savedOrder.getTotalAmount())
                .paymentMethod(savedOrder.getPaymentMethod())
                .build();

        try {
            rabbitTemplate.convertAndSend(PAYMENT_EXCHANGE, PAYMENT_ROUTING_KEY, paymentRequest);
            log.info("Pedido simplificado enviado para processamento de pagamento");
        } catch (Exception e) {
            log.error("Erro ao enviar pedido simplificado para processamento de pagamento: {}", e.getMessage());
            // Não interrompe o fluxo em caso de erro no RabbitMQ
        }

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
            
            if (orders == null) {
                log.warn("Nenhum pedido encontrado para o usuário: {}", userId);
                return new ArrayList<>();
            }
            
            log.info("Encontrados {} pedidos para o usuário {}", orders.size(), userId);
            
            return orders.stream()
                    .map(this::mapToOrderResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            log.error("Erro de validação ao buscar pedidos para o usuário {}: {}", userId, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Erro ao buscar pedidos para o usuário {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Erro ao buscar pedidos do usuário: " + e.getMessage());
        }
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        try {
            log.info("Buscando todos os pedidos");
            
            List<Order> orders = orderRepository.findAll();
            log.info("Encontrados {} pedidos no total", orders.size());
            
            return orders.stream()
                    .map(this::mapToOrderResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao buscar todos os pedidos: {}", e.getMessage());
            throw new RuntimeException("Erro ao buscar todos os pedidos", e);
        }
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado com id: " + id));
        
        OrderStatus oldStatus = order.getStatus();
        order.setStatus(status);
        
        Order updatedOrder = orderRepository.save(order);
        
        // Enviar notificação sobre a mudança de status
        try {
            String eventType = getEventTypeForStatus(status);
            
            // Criar objeto para enviar via RabbitMQ
            Map<String, Object> orderStatusEvent = new HashMap<>();
            orderStatusEvent.put("eventType", eventType);
            orderStatusEvent.put("orderId", updatedOrder.getId());
            orderStatusEvent.put("userId", updatedOrder.getUserId());
            orderStatusEvent.put("oldStatus", oldStatus.name());
            orderStatusEvent.put("newStatus", status.name());
            orderStatusEvent.put("timestamp", LocalDateTime.now().toString());
            
            // Converter para JSON
            String orderStatusJson = objectMapper.writeValueAsString(orderStatusEvent);
            
            // Enviar para a fila de notificações
            rabbitTemplate.convertAndSend(
                NOTIFICATION_EXCHANGE, 
                ORDER_NOTIFICATION_ROUTING_KEY, 
                orderStatusJson
            );
            
            log.info("Notificação de alteração de status enviada para o pedido: {}, de {} para {}", 
                updatedOrder.getId(), oldStatus, status);
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de alteração de status: {}", e.getMessage());
            // Não interrompe o fluxo em caso de erro no envio da notificação
        }
        
        return mapToOrderResponse(updatedOrder);
    }
    
    private String getEventTypeForStatus(OrderStatus status) {
        switch (status) {
            case CONFIRMED:
                return "ORDER_CONFIRMED";
            case PROCESSING:
                return "ORDER_PROCESSING";
            case SHIPPED:
                return "ORDER_SHIPPED";
            case DELIVERED:
                return "ORDER_DELIVERED";
            case CANCELLED:
                return "ORDER_CANCELLED";
            case RETURNED:
                return "ORDER_RETURNED";
            default:
                return "ORDER_STATUS_UPDATED";
        }
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