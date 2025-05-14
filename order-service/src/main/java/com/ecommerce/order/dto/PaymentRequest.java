package com.ecommerce.order.dto;

import com.ecommerce.order.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentRequest {
    private Long orderId;
    private String userId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
} 