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
        log.info("Pedido criado com sucesso: {}", savedOrder.getId());

        // Enviar notificação de pedido criado
        sendOrderNotification(savedOrder.getUserId(), "order_created", 
            String.format("Pedido #%d criado com sucesso! Total: R$ %.2f", 
                savedOrder.getId(), savedOrder.getTotalAmount()));

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

        // Enviar notificação de pedido criado
        sendOrderNotification(savedOrder.getUserId(), "order_created", 
            String.format("Pedido #%d criado com sucesso! Total: R$ %.2f", 
                savedOrder.getId(), savedOrder.getTotalAmount()));

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
        log.info("=== INICIO updateOrderStatus - id: {}, status: {} ===", id, status);
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado com id: " + id));
        
        OrderStatus oldStatus = order.getStatus();
        log.info("Status anterior: {}, novo status: {}", oldStatus, status);
        
        order.setStatus(status);
        
        Order updatedOrder = orderRepository.save(order);
        log.info("Pedido salvo com sucesso");
        
        try {
            String eventType = getEventTypeForStatus(status);
            log.info("EventType gerado: {}", eventType);
            
            Map<String, Object> orderStatusEvent = new HashMap<>();
            orderStatusEvent.put("eventType", eventType);
            orderStatusEvent.put("orderId", updatedOrder.getId());
            orderStatusEvent.put("userId", updatedOrder.getUserId());
            orderStatusEvent.put("oldStatus", oldStatus.name());
            orderStatusEvent.put("newStatus", status.name());
            orderStatusEvent.put("timestamp", LocalDateTime.now().toString());
            
            String orderStatusJson = objectMapper.writeValueAsString(orderStatusEvent);
            log.info("JSON gerado: {}", orderStatusJson);
            
            log.info("Enviando mensagem para exchange: {}, routing key: {}", ORDER_NOTIFICATION_EXCHANGE, ORDER_NOTIFICATION_ROUTING_KEY);
            
            rabbitTemplate.convertAndSend(
                ORDER_NOTIFICATION_EXCHANGE, 
                ORDER_NOTIFICATION_ROUTING_KEY, 
                orderStatusJson
            );
            
            log.info("Notificação de alteração de status enviada para o pedido: {}, de {} para {}", 
                updatedOrder.getId(), oldStatus, status);
            
            // Verificação para entrega
            boolean isDeliveryUpdate = isDeliveryStatusUpdate(status);
            log.info("É atualização de entrega? {}", isDeliveryUpdate);
                
            if (isDeliveryUpdate) {
                log.info("Enviando notificação de entrega...");
                sendDeliveryNotification(updatedOrder, eventType);
            }
            
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de alteração de status: {}", e.getMessage(), e);
        }
        
        log.info("=== FIM updateOrderStatus ===");
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
    
    private boolean isDeliveryStatusUpdate(OrderStatus status) {
        return status == OrderStatus.SHIPPED || 
               status == OrderStatus.DELIVERED;
    }
    
    private void sendDeliveryNotification(Order order, String eventType) {
        try {
            log.info("=== INICIO sendDeliveryNotification - eventType: {}, orderId: {}, userId: {} ===", 
                    eventType, order.getId(), order.getUserId());
            
            String title = getDeliveryNotificationTitle(eventType);
            String message = getDeliveryNotificationMessage(eventType, order);
            
            log.info("Título: {}", title);
            log.info("Mensagem: {}", message);
            
            Map<String, Object> deliveryNotification = new HashMap<>();
            deliveryNotification.put("userId", Long.valueOf(order.getUserId()));
            deliveryNotification.put("orderId", order.getId());
            deliveryNotification.put("eventType", eventType);
            deliveryNotification.put("title", title);
            deliveryNotification.put("message", message);
            deliveryNotification.put("status", order.getStatus().name());
            deliveryNotification.put("trackingNumber", order.getTrackingNumber());
            deliveryNotification.put("timestamp", LocalDateTime.now().toString());
            
            String deliveryNotificationJson = objectMapper.writeValueAsString(deliveryNotification);
            log.info("JSON de entrega gerado: {}", deliveryNotificationJson);
            
            log.info("Enviando notificação de entrega para exchange: {}, routing key: {}", 
                    ORDER_NOTIFICATION_EXCHANGE, ORDER_NOTIFICATION_ROUTING_KEY);
            
            rabbitTemplate.convertAndSend(
                ORDER_NOTIFICATION_EXCHANGE,
                ORDER_NOTIFICATION_ROUTING_KEY,
                deliveryNotificationJson
            );
            
            log.info("Notificação de entrega enviada para usuário {}: {} - pedido: {}", 
                    order.getUserId(), eventType, order.getId());
            log.info("=== FIM sendDeliveryNotification ===");
                    
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de entrega: {}", e.getMessage(), e);
        }
    }
    
    private String getDeliveryNotificationTitle(String eventType) {
        switch (eventType) {
            case "ORDER_SHIPPED":
                return "Pedido Enviado";
            case "ORDER_DELIVERED":
                return "Pedido Entregue";
            default:
                return "Atualização de Entrega";
        }
    }
    
    private String getDeliveryNotificationMessage(String eventType, Order order) {
        switch (eventType) {
            case "ORDER_SHIPPED":
                if (order.getTrackingNumber() != null && !order.getTrackingNumber().isEmpty()) {
                    return String.format("Seu pedido #%d foi enviado! Código de rastreamento: %s. Acompanhe a entrega.", 
                            order.getId(), order.getTrackingNumber());
                } else {
                    return String.format("Seu pedido #%d foi enviado para entrega! Em breve você receberá o código de rastreamento.", 
                            order.getId());
                }
            case "ORDER_DELIVERED":
                return String.format("Seu pedido #%d foi entregue com sucesso! Obrigado por comprar conosco. Esperamos que goste do seu produto!", 
                        order.getId());
            default:
                return String.format("Status de entrega do seu pedido #%d foi atualizado.", order.getId());
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
        
        try {
            String title = "Código de Rastreamento Disponível";
            String message = String.format("Seu pedido #%d agora tem código de rastreamento: %s. Acompanhe sua entrega!", 
                    order.getId(), trackingNumber);
            
            Map<String, Object> trackingNotification = new HashMap<>();
            trackingNotification.put("userId", Long.valueOf(order.getUserId()));
            trackingNotification.put("orderId", order.getId());
            trackingNotification.put("eventType", "TRACKING_ADDED");
            trackingNotification.put("title", title);
            trackingNotification.put("message", message);
            trackingNotification.put("trackingNumber", trackingNumber);
            trackingNotification.put("timestamp", LocalDateTime.now().toString());
            
            String trackingNotificationJson = objectMapper.writeValueAsString(trackingNotification);
            
            rabbitTemplate.convertAndSend(
                ORDER_NOTIFICATION_EXCHANGE,
                ORDER_NOTIFICATION_ROUTING_KEY,
                trackingNotificationJson
            );
            
            log.info("Notificação de código de rastreamento enviada para usuário {}: {} - pedido: {}", 
                    order.getUserId(), trackingNumber, order.getId());
                    
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de código de rastreamento: {}", e.getMessage());
        }
        
        return mapToOrderResponse(updatedOrder);
    }

    @Override
    @Transactional
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    private void sendOrderNotification(String userId, String action, String message) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", Long.valueOf(userId));
            notification.put("action", action);
            notification.put("message", message);
            notification.put("timestamp", LocalDateTime.now().toString());

            rabbitTemplate.convertAndSend(
                ORDER_NOTIFICATION_EXCHANGE,
                ORDER_NOTIFICATION_ROUTING_KEY,
                notification
            );

            log.info("Notificação de pedido enviada para usuário {}: {}", userId, action);
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de pedido: {}", e.getMessage());
        }
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> orderItemResponses = order.getItems().stream()
                .map(item -> {
                    ProductDto productDetails = null;
                    try {
                        productDetails = productClient.getProduct(item.getProductId());
                    } catch (Exception e) {
                        log.warn("Erro ao buscar detalhes do produto {}: {}", item.getProductId(), e.getMessage());
                        productDetails = ProductDto.builder()
                                .id(item.getProductId())
                                .name(item.getProductName())
                                .price(item.getPrice())
                                .build();
                    }
                    
                    return OrderItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProductId())
                            .productName(item.getProductName())
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .subtotal(item.getSubtotal())
                            .product(productDetails)
                            .build();
                })
                .collect(Collectors.toList());

        ShippingAddressDto shippingAddress = parseDeliveryAddress(order.getDeliveryAddress());
        
        PaymentInfoDto paymentInfo = PaymentInfoDto.builder()
                .paymentId(order.getPaymentId())
                .method(order.getPaymentMethod())
                .status("approved")
                .transactionId("txn_" + (order.getPaymentId() != null ? order.getPaymentId() : 
                    String.valueOf(Math.random()).substring(2, 10)))
                .amount(order.getTotalAmount())
                .paymentDate(order.getCreatedAt())
                .cardBrand("Visa")
                .cardLastFour("1234")
                .build();

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .totalAmount(order.getTotalAmount())
                .shippingPrice(BigDecimal.ZERO)
                .items(orderItemResponses)
                .deliveryAddress(order.getDeliveryAddress())
                .shippingAddress(shippingAddress)
                .trackingNumber(order.getTrackingNumber())
                .paymentId(order.getPaymentId())
                .paymentMethod(order.getPaymentMethod())
                .payment(paymentInfo)
                .build();
    }
    
    private ShippingAddressDto parseDeliveryAddress(String deliveryAddress) {
        if (deliveryAddress == null || deliveryAddress.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Formato esperado: "Rua, Número, Complemento, Bairro, Cidade - Estado, CEP"
            // ou: "Rua, Número, Bairro, Cidade - Estado, CEP" (sem complemento)
            
            String[] parts = deliveryAddress.split(",");
            
            if (parts.length < 4) {
                log.warn("Formato de endereço inválido, usando valores padrão: {}", deliveryAddress);
                return createDefaultShippingAddress();
            }
            
            String street = parts[0].trim();
            String number = parts[1].trim();
            
            String complement = "";
            String neighborhood = "";
            String cityStateZip = "";
            
            if (parts.length == 5) {
                // Com complemento: Rua, Número, Complemento, Bairro, Cidade - Estado, CEP
                complement = parts[2].trim();
                neighborhood = parts[3].trim();
                cityStateZip = parts[4].trim();
            } else if (parts.length == 4) {
                // Sem complemento: Rua, Número, Bairro, Cidade - Estado, CEP
                neighborhood = parts[2].trim();
                cityStateZip = parts[3].trim();
            } else {
                // Formato com mais partes, tentar extrair
                complement = parts[2].trim();
                neighborhood = parts[3].trim();
                // Juntar o resto como cityStateZip
                StringBuilder sb = new StringBuilder();
                for (int i = 4; i < parts.length; i++) {
                    if (i > 4) sb.append(",");
                    sb.append(parts[i]);
                }
                cityStateZip = sb.toString().trim();
            }
            
            // Extrair cidade, estado e CEP de "Cidade - Estado, CEP"
            String city = "";
            String state = "";
            String zipCode = "";
            
            if (cityStateZip.contains(" - ")) {
                String[] cityStateParts = cityStateZip.split(" - ");
                city = cityStateParts[0].trim();
                
                if (cityStateParts.length > 1) {
                    String stateZip = cityStateParts[1].trim();
                    if (stateZip.contains(",")) {
                        String[] stateZipParts = stateZip.split(",");
                        state = stateZipParts[0].trim();
                        if (stateZipParts.length > 1) {
                            zipCode = stateZipParts[1].trim();
                        }
                    } else {
                        state = stateZip;
                    }
                }
            } else {
                // Formato alternativo, tentar extrair CEP do final
                if (cityStateZip.matches(".*\\d{5}-?\\d{3}.*")) {
                    // Tem CEP
                    String[] lastCommaParts = cityStateZip.split(",");
                    if (lastCommaParts.length >= 2) {
                        zipCode = lastCommaParts[lastCommaParts.length - 1].trim();
                        String remaining = cityStateZip.substring(0, cityStateZip.lastIndexOf(",")).trim();
                        if (remaining.contains(" - ")) {
                            String[] cityStateParts = remaining.split(" - ");
                            city = cityStateParts[0].trim();
                            if (cityStateParts.length > 1) {
                                state = cityStateParts[1].trim();
                            }
                        } else {
                            city = remaining;
                        }
                    }
                } else {
                    city = cityStateZip;
                }
            }
            
            log.info("Endereço parseado - Rua: {}, Número: {}, Complemento: {}, Bairro: {}, Cidade: {}, Estado: {}, CEP: {}", 
                    street, number, complement, neighborhood, city, state, zipCode);
            
            return ShippingAddressDto.builder()
                    .street(street.isEmpty() ? "Não informado" : street)
                    .number(number.isEmpty() ? "S/N" : number)
                    .complement(complement.isEmpty() ? null : complement)
                    .neighborhood(neighborhood.isEmpty() ? "Não informado" : neighborhood)
                    .city(city.isEmpty() ? "Não informado" : city)
                    .state(state.isEmpty() ? "BR" : state)
                    .zipCode(zipCode.isEmpty() ? "00000-000" : zipCode)
                    .country("Brasil")
                    .build();
                    
        } catch (Exception e) {
            log.error("Erro ao fazer parsing do endereço '{}': {}", deliveryAddress, e.getMessage());
            return createDefaultShippingAddress();
        }
    }
    
    private ShippingAddressDto createDefaultShippingAddress() {
        return ShippingAddressDto.builder()
                .street("Endereço não disponível")
                .number("S/N")
                .complement(null)
                .neighborhood("Não informado")
                .city("Não informado")
                .state("BR")
                .zipCode("00000-000")
                .country("Brasil")
                .build();
    }
} 