package br.com.pattern.payment.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private String paymentId;
    private Long orderId;
    private String status;
    private String transactionId;
    private String errorMessage;
    private LocalDateTime paymentDate;
    private BigDecimal amount;
    private String paymentMethod;
}