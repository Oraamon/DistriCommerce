package com.ecommerce.payment.dto;

import com.ecommerce.payment.model.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentRequest {

    @NotNull(message = "ID do pedido é obrigatório")
    private Long orderId;
    
    @NotBlank(message = "ID do usuário é obrigatório")
    private String userId;
    
    @NotNull(message = "Valor é obrigatório")
    @Positive(message = "Valor deve ser maior que zero")
    private BigDecimal amount;
    
    @NotNull(message = "Método de pagamento é obrigatório")
    private PaymentMethod paymentMethod;
    
    private String cardNumber;
    private String cardHolderName;
    private String expirationDate;
    private String cvv;
} 