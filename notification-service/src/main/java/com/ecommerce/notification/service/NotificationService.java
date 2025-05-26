package com.ecommerce.notification.service;

import com.ecommerce.notification.dto.NotificationRequest;
import com.ecommerce.notification.dto.NotificationResponse;
import com.ecommerce.notification.model.NotificationType;

import java.util.List;

public interface NotificationService {
    NotificationResponse createNotification(NotificationRequest request);
    List<NotificationResponse> getUserNotifications(String userId);
    List<NotificationResponse> getUserUnreadNotifications(String userId);
    long countUserUnreadNotifications(String userId);
    NotificationResponse markNotificationAsRead(Long id);
    void markAllNotificationsAsRead(String userId);
    void sendCartNotification(String userId, String action, String data);
    void sendOrderNotification(String userId, String action, String data);
} 