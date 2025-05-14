package com.ecommerce.order.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private Long orderId;
    private String status;
    private String transactionId;
    private String errorMessage;
    private LocalDateTime paymentDate;
    private Double amount;
    private String paymentMethod;
} 