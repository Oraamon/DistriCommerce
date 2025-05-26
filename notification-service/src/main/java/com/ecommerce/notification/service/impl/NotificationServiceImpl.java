package com.ecommerce.notification.service.impl;

import com.ecommerce.notification.dto.NotificationRequest;
import com.ecommerce.notification.dto.NotificationResponse;
import com.ecommerce.notification.model.Notification;
import com.ecommerce.notification.model.NotificationType;
import com.ecommerce.notification.repository.NotificationRepository;
import com.ecommerce.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import static com.ecommerce.notification.config.RabbitMQConfig.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        try {
            Notification notification = Notification.builder()
                    .userId(request.getUserId())
                    .type(request.getType())
                    .title(request.getTitle())
                    .message(request.getMessage())
                    .data(request.getData())
                    .build();
            
            Notification savedNotification = notificationRepository.save(notification);
            log.info("Notificação criada para o usuário: {}, tipo: {}", request.getUserId(), request.getType());
            
            return mapToNotificationResponse(savedNotification);
        } catch (Exception e) {
            log.error("Erro ao criar notificação: {}", e.getMessage());
            throw new RuntimeException("Erro ao criar notificação", e);
        }
    }

    @Override
    public List<NotificationResponse> getUserNotifications(Long userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            log.info("Recuperadas {} notificações para o usuário: {}", notifications.size(), userId);
            
            return notifications.stream()
                    .map(this::mapToNotificationResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao recuperar notificações do usuário: {}", e.getMessage());
            throw new RuntimeException("Erro ao recuperar notificações do usuário", e);
        }
    }

    @Override
    public List<NotificationResponse> getUserUnreadNotifications(Long userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false);
            log.info("Recuperadas {} notificações não lidas para o usuário: {}", notifications.size(), userId);
            
            return notifications.stream()
                    .map(this::mapToNotificationResponse)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Erro ao recuperar notificações não lidas do usuário: {}", e.getMessage());
            throw new RuntimeException("Erro ao recuperar notificações não lidas do usuário", e);
        }
    }

    @Override
    public long countUserUnreadNotifications(Long userId) {
        try {
            return notificationRepository.countByUserIdAndRead(userId, false);
        } catch (Exception e) {
            log.error("Erro ao contar notificações não lidas do usuário: {}", e.getMessage());
            throw new RuntimeException("Erro ao contar notificações não lidas do usuário", e);
        }
    }

    @Override
    @Transactional
    public NotificationResponse markNotificationAsRead(Long id) {
        try {
            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notificação não encontrada: " + id));
            
            notification.setRead(true);
            Notification updatedNotification = notificationRepository.save(notification);
            log.info("Notificação marcada como lida: {}", id);
            
            return mapToNotificationResponse(updatedNotification);
        } catch (Exception e) {
            log.error("Erro ao marcar notificação como lida: {}", e.getMessage());
            throw new RuntimeException("Erro ao marcar notificação como lida", e);
        }
    }

    @Override
    @Transactional
    public void markAllNotificationsAsRead(Long userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false);
            
            for (Notification notification : notifications) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
            
            log.info("Todas as notificações marcadas como lidas para o usuário: {}", userId);
        } catch (Exception e) {
            log.error("Erro ao marcar todas as notificações como lidas: {}", e.getMessage());
            throw new RuntimeException("Erro ao marcar todas as notificações como lidas", e);
        }
    }

    @Override
    public void sendCartNotification(Long userId, String action, String data) {
        try {
            String message = createCartMessage(action);
            
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(NotificationType.CART_UPDATE)
                    .title("Atualização do Carrinho")
                    .message(message)
                    .data(data)
                    .build();
            
            // Criar a notificação localmente
            createNotification(request);
            
            // Enviar para a fila RabbitMQ
            rabbitTemplate.convertAndSend(CART_NOTIFICATION_EXCHANGE, CART_NOTIFICATION_ROUTING_KEY, request);
            log.info("Notificação de carrinho enviada para o usuário: {}, ação: {}", userId, action);
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de carrinho: {}", e.getMessage());
        }
    }

    @Override
    public void sendOrderNotification(Long userId, String action, String data) {
        try {
            String message = createOrderMessage(action);
            
            NotificationRequest request = NotificationRequest.builder()
                    .userId(userId)
                    .type(NotificationType.ORDER_STATUS)
                    .title("Atualização do Pedido")
                    .message(message)
                    .data(data)
                    .build();
            
            // Criar a notificação localmente
            createNotification(request);
            
            // Enviar para a fila RabbitMQ
            rabbitTemplate.convertAndSend(ORDER_NOTIFICATION_EXCHANGE, ORDER_NOTIFICATION_ROUTING_KEY, request);
            log.info("Notificação de pedido enviada para o usuário: {}, ação: {}", userId, action);
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de pedido: {}", e.getMessage());
        }
    }
    
    private String createCartMessage(String action) {
        switch (action) {
            case "item_added":
                return "Um novo item foi adicionado ao seu carrinho";
            case "item_removed":
                return "Um item foi removido do seu carrinho";
            case "item_updated":
                return "Um item do seu carrinho foi atualizado";
            case "cart_cleared":
                return "Seu carrinho foi esvaziado";
            default:
                return "Seu carrinho foi atualizado";
        }
    }
    
    private String createOrderMessage(String action) {
        switch (action) {
            case "order_created":
                return "Seu pedido foi criado com sucesso";
            case "order_confirmed":
                return "Seu pedido foi confirmado";
            case "order_processing":
                return "Seu pedido está em processamento";
            case "order_shipped":
                return "Seu pedido foi enviado para entrega";
            case "order_delivered":
                return "Seu pedido foi entregue";
            case "order_cancelled":
                return "Seu pedido foi cancelado";
            default:
                return "O status do seu pedido foi atualizado";
        }
    }
    
    private NotificationResponse mapToNotificationResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .data(notification.getData())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
} 