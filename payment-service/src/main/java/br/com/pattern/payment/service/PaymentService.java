package br.com.pattern.payment.service;

import br.com.pattern.payment.dto.PaymentRequest;
import br.com.pattern.payment.dto.PaymentResponse;

public interface PaymentService {
    PaymentResponse processPayment(PaymentRequest request);
    PaymentResponse getPaymentByOrderId(String orderId);
    PaymentResponse refundPayment(String orderId);
} 