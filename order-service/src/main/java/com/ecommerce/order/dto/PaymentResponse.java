package com.ecommerce.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentResponse {
    private Long orderId;
    private String status;
    private String paymentId;
    private String transactionId;
    private String errorMessage;
    private LocalDateTime paymentDate;
    private BigDecimal amount;
    private String paymentMethod;
} 