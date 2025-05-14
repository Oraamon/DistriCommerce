package br.com.pattern.payment.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequest {
    private String orderId;
    private String userId;
    private BigDecimal amount;
    private String paymentMethod;
    private String deliveryAddress;
    private String items;
} 