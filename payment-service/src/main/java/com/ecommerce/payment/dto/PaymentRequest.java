package com.ecommerce.payment.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PaymentRequest {
    private String orderId;
    private BigDecimal amount;
    private String paymentMethod;
    private List<OrderItemDto> orderItems;
} 