package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;

import java.util.List;

public interface PaymentService {
    
    PaymentResponse processPayment(PaymentRequest paymentRequest);
    
    PaymentResponse getPaymentById(Long id);
    
    PaymentResponse getPaymentByOrderId(Long orderId);
    
    List<PaymentResponse> getPaymentsByUserId(String userId);
    
    PaymentResponse refundPayment(Long id);
} 