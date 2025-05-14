package com.ecommerce.order.dto;

import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderResponse {
    private Long id;
    private String userId;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private BigDecimal totalAmount;
    private List<OrderItemResponse> items;
    private String deliveryAddress;
    private String trackingNumber;
    private String paymentId;
    private PaymentMethod paymentMethod;
} 