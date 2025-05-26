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

    @RabbitListener(queues = ORDER_NOTIFICATION_QUEUE)
    public void handleOrderNotification(NotificationRequest request) {
        try {
            log.info("Recebida notificação de pedido para o usuário: {}", request.getUserId());
            notificationService.createNotification(request);
        } catch (Exception e) {
            log.error("Erro ao processar notificação de pedido: {}", e.getMessage());
        }
    }
    
    // Ouvinte para mensagens de pedido
    @RabbitListener(queues = "order.queue")
    public void handleOrderEvent(String message) {
        try {
            JsonNode jsonNode = objectMapper.readTree(message);
            String eventType = jsonNode.get("eventType").asText();
            String userId = jsonNode.get("userId").asText();
            
            log.info("Recebido evento de pedido: {}, usuário: {}", eventType, userId);
            
            String notificationMessage = "";
            switch (eventType) {
                case "ORDER_CREATED":
                    notificationMessage = "Seu pedido foi criado com sucesso";
                    break;
                case "ORDER_CONFIRMED":
                    notificationMessage = "Seu pedido foi confirmado";
                    break;
                case "ORDER_SHIPPED":
                    notificationMessage = "Seu pedido foi enviado para entrega";
                    break;
                case "ORDER_DELIVERED":
                    notificationMessage = "Seu pedido foi entregue";
                    break;
                case "ORDER_CANCELLED":
                    notificationMessage = "Seu pedido foi cancelado";
                    break;
                default:
                    notificationMessage = "O status do seu pedido foi atualizado";
            }
            
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(NotificationType.ORDER_STATUS)
                    .message(notificationMessage)
                    .data(message)
                    .build();
            
            notificationService.createNotification(request);
            
        } catch (Exception e) {
            log.error("Erro ao processar evento de pedido: {}", e.getMessage());
        }
    }
    
    // Ouvinte para mensagens de pagamento
    @RabbitListener(queues = "payment.queue")
    public void handlePaymentEvent(String message) {
        try {
            JsonNode jsonNode = objectMapper.readTree(message);
            String eventType = jsonNode.get("eventType").asText();
            String userId = jsonNode.get("userId").asText();
            
            log.info("Recebido evento de pagamento: {}, usuário: {}", eventType, userId);
            
            String notificationMessage = "";
            switch (eventType) {
                case "PAYMENT_RECEIVED":
                    notificationMessage = "Seu pagamento foi recebido";
                    break;
                case "PAYMENT_CONFIRMED":
                    notificationMessage = "Seu pagamento foi confirmado";
                    break;
                case "PAYMENT_FAILED":
                    notificationMessage = "Seu pagamento falhou. Por favor, tente novamente";
                    break;
                default:
                    notificationMessage = "O status do seu pagamento foi atualizado";
            }
            
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(NotificationType.PAYMENT_STATUS)
                    .message(notificationMessage)
                    .data(message)
                    .build();
            
            notificationService.createNotification(request);
            
        } catch (Exception e) {
            log.error("Erro ao processar evento de pagamento: {}", e.getMessage());
        }
    }

    @RabbitListener(queues = "cart.queue")
    public void handleCartEvent(String message) {
        try {
            JsonNode jsonNode = objectMapper.readTree(message);
            String action = jsonNode.get("action").asText();
            JsonNode data = jsonNode.get("data");
            String userId = data.get("userId").asText();
            
            log.info("Recebido evento de carrinho: {}, usuário: {}", action, userId);
            
            String notificationMessage = "";
            switch (action) {
                case "ITEM_ADDED":
                    notificationMessage = "Item adicionado ao carrinho";
                    break;
                case "ITEM_REMOVED":
                    notificationMessage = "Item removido do carrinho";
                    break;
                case "ITEM_UPDATED":
                    notificationMessage = "Quantidade do item atualizada";
                    break;
                case "CART_CLEARED":
                    notificationMessage = "Carrinho esvaziado";
                    break;
                default:
                    notificationMessage = "Seu carrinho foi atualizado";
            }
            
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(NotificationType.CART_UPDATE)
                    .message(notificationMessage)
                    .data(message)
                    .build();
            
            notificationService.createNotification(request);
            
        } catch (Exception e) {
            log.error("Erro ao processar evento de carrinho: {}", e.getMessage());
        }
    }
} 