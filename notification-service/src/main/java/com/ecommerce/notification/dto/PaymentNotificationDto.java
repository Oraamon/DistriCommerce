package com.ecommerce.notification.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentNotificationDto {
    private String paymentId;
    private String orderId;
    private String userId;
    private String status;
    private String transactionId;
    private String errorMessage;
    private String paymentDate;
    private Double amount;
    private String paymentMethod;
} 