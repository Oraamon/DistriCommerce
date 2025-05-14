package com.ecommerce.product.service;

public interface StockService {
    void processCompletedPayment(String orderId);
    void processFailedPayment(String orderId);
    void processRefundedPayment(String orderId);
} 