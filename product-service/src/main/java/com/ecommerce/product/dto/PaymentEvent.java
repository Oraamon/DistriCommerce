package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEvent {
    private Long id;
    private String orderId;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createdAt;
    private List<OrderItemDto> orderItems;
} 