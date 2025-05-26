package com.ecommerce.notification.dto;

import com.ecommerce.notification.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private Long userId;
    private NotificationType type;
    private String title;
    private String message;
    private String data;
} 