package com.ecommerce.notification.service;

import com.ecommerce.notification.dto.NotificationRequest;
import com.ecommerce.notification.dto.NotificationResponse;
import com.ecommerce.notification.model.NotificationType;

import java.util.List;

public interface NotificationService {
    NotificationResponse createNotification(NotificationRequest request);
    List<NotificationResponse> getUserNotifications(Long userId);
    List<NotificationResponse> getUserUnreadNotifications(Long userId);
    long countUserUnreadNotifications(Long userId);
    NotificationResponse markNotificationAsRead(Long id);
    void markAllNotificationsAsRead(Long userId);
    void sendCartNotification(Long userId, String action, String data);
    void sendOrderNotification(Long userId, String action, String data);
} 