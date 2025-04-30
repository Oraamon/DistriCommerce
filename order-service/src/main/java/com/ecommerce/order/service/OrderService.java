package com.ecommerce.order.service;

import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.OrderResponse;
import com.ecommerce.order.model.OrderStatus;

import java.util.List;

public interface OrderService {
    
    OrderResponse createOrder(OrderRequest orderRequest);
    
    OrderResponse getOrderById(Long id);
    
    List<OrderResponse> getOrdersByUserId(String userId);
    
    OrderResponse updateOrderStatus(Long id, OrderStatus status);
    
    OrderResponse updateTrackingInfo(Long id, String trackingNumber);
    
    void deleteOrder(Long id);
} 