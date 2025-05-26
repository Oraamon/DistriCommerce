package com.ecommerce.notification.messaging;

import com.ecommerce.notification.dto.NotificationRequest;
import com.ecommerce.notification.model.NotificationType;
import com.ecommerce.notification.service.NotificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import static com.ecommerce.notification.config.RabbitMQConfig.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationListener {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = NOTIFICATION_QUEUE)
    public void handleNotification(NotificationRequest request) {
        try {
            log.info("Recebida notificação geral para o usuário: {}", request.getUserId());
            notificationService.createNotification(request);
        } catch (Exception e) {
            log.error("Erro ao processar notificação geral: {}", e.getMessage());
        }
    }

    @RabbitListener(queues = CART_NOTIFICATION_QUEUE)
    public void handleCartNotification(NotificationRequest request) {
        try {
            log.info("Recebida notificação de carrinho para o usuário: {}", request.getUserId());
            notificationService.createNotification(request);
        } catch (Exception e) {
            log.error("Erro ao processar notificação de carrinho: {}", e.getMessage());
        }
    }

    @RabbitListener(queues = "cart.queue")
    public void handleCartEvent(String cartEventJson) {
        try {
            log.info("Recebido evento de carrinho: {}", cartEventJson);
            
            JsonNode cartEvent = objectMapper.readTree(cartEventJson);
            String action = cartEvent.get("action").asText();
            Long userId = cartEvent.get("userId").asLong();
            String productId = cartEvent.get("productId").asText();
            int quantity = cartEvent.get("quantity").asInt();
            
            String title = "Atualização do Carrinho";
            String message = createCartMessage(action, productId, quantity);
            
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(NotificationType.CART_UPDATE)
                    .title(title)
                    .message(message)
                    .data(cartEventJson)
                    .build();
            
            notificationService.createNotification(request);
            log.info("Notificação de carrinho criada para usuário: {} - ação: {}", userId, action);
            
        } catch (Exception e) {
            log.error("Erro ao processar evento de carrinho: {}", e.getMessage());
        }
    }

    private String createCartMessage(String action, String productId, int quantity) {
        switch (action) {
            case "item_added":
                return String.format("Produto %s foi adicionado ao seu carrinho (quantidade: %d)", productId, quantity);
            case "item_removed":
                return String.format("Produto %s foi removido do seu carrinho", productId);
            case "item_updated":
                return String.format("Quantidade do produto %s foi atualizada para %d", productId, quantity);
            case "cart_cleared":
                return "Seu carrinho foi esvaziado";
            default:
                return "Seu carrinho foi atualizado";
        }
    }

    @RabbitListener(queues = ORDER_NOTIFICATION_QUEUE)
    public void handleOrderNotification(NotificationRequest request) {
        try {
            log.info("Recebida notificação de pedido para o usuário: {}", request.getUserId());
            notificationService.createNotification(request);
        } catch (Exception e) {
            log.error("Erro ao processar notificação de pedido: {}", e.getMessage());
        }
    }

    @RabbitListener(queues = "order.notification.queue")
    public void handleOrderEvent(String orderEventJson) {
        try {
            log.info("Recebido evento de pedido: {}", orderEventJson);
            
            JsonNode orderEvent = objectMapper.readTree(orderEventJson);
            String action = orderEvent.get("action").asText();
            Long userId = orderEvent.get("userId").asLong();
            String message = orderEvent.get("message").asText();
            
            String title = getOrderNotificationTitle(action);
            
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(NotificationType.ORDER_STATUS)
                    .title(title)
                    .message(message)
                    .data(orderEventJson)
                    .build();
            
            notificationService.createNotification(request);
            log.info("Notificação de pedido criada para usuário: {} - ação: {}", userId, action);
            
        } catch (Exception e) {
            log.error("Erro ao processar evento de pedido: {}", e.getMessage());
        }
    }

    @RabbitListener(queues = PAYMENT_NOTIFICATION_QUEUE, containerFactory = "stringListenerContainerFactory")
    public void handlePaymentResult(String paymentResultJson) {
        try {
            log.info("Recebido resultado de pagamento: {}", paymentResultJson);
            
            JsonNode paymentResult = objectMapper.readTree(paymentResultJson);
            String status = paymentResult.get("status").asText();
            String orderId = paymentResult.has("orderId") && !paymentResult.get("orderId").isNull() 
                ? paymentResult.get("orderId").asText() : "N/A";
            
            String title;
            String messageText;
            NotificationType type = NotificationType.PAYMENT_STATUS;
            
            if ("APPROVED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
                title = "Pagamento Aprovado";
                messageText = String.format("Seu pagamento foi aprovado com sucesso! Pedido: %s", orderId);
            } else if ("FAILED".equalsIgnoreCase(status) || "REJECTED".equalsIgnoreCase(status)) {
                title = "Pagamento Rejeitado";
                messageText = String.format("Seu pagamento foi rejeitado. Pedido: %s. Tente novamente ou use outro método de pagamento.", orderId);
            } else {
                title = "Atualização de Pagamento";
                messageText = String.format("Status do pagamento atualizado para: %s. Pedido: %s", status, orderId);
            }
            
            Long userId = 1L;
            if (paymentResult.has("userId") && !paymentResult.get("userId").isNull()) {
                String userIdStr = paymentResult.get("userId").asText();
                try {
                    userId = Long.parseLong(userIdStr);
                } catch (NumberFormatException e) {
                    log.warn("Não foi possível converter userId para Long: {}, usando valor padrão", userIdStr);
                }
            }
            
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(type)
                    .title(title)
                    .message(messageText)
                    .data(paymentResultJson)
                    .build();
            
            notificationService.createNotification(request);
            log.info("Notificação de pagamento criada para usuário: {} - status: {}", userId, status);
            
        } catch (Exception e) {
            log.error("Erro ao processar resultado de pagamento: {}", e.getMessage(), e);
        }
    }

    private String getOrderNotificationTitle(String action) {
        switch (action) {
            case "order_created":
                return "Pedido Criado";
            case "order_confirmed":
                return "Pedido Confirmado";
            case "order_processing":
                return "Pedido em Processamento";
            case "order_shipped":
                return "Pedido Enviado";
            case "order_delivered":
                return "Pedido Entregue";
            case "order_cancelled":
                return "Pedido Cancelado";
            case "payment_approved":
                return "Pagamento Aprovado";
            case "payment_failed":
                return "Pagamento Rejeitado";
            default:
                return "Atualização do Pedido";
        }
    }
} 