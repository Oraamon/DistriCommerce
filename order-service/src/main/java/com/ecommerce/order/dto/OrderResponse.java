package com.ecommerce.order.dto;

import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.model.PaymentStatus;
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
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private List<OrderItemResponse> orderItems;
    private String shippingAddress;
    private String trackingNumber;
    private PaymentStatus paymentStatus;
} 