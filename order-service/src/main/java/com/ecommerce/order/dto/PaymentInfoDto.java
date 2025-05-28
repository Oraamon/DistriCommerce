package com.ecommerce.order.dto;

import com.ecommerce.order.model.PaymentMethod;
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
public class PaymentInfoDto {
    private String paymentId;
    private PaymentMethod method;
    private String status;
    private String transactionId;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
    private String cardBrand;
    private String cardLastFour;
    private String errorMessage;
} 