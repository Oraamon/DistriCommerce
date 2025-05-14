package com.ecommerce.order.dto;

import com.ecommerce.order.model.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OrderRequest {

    @NotBlank(message = "ID do usuário é obrigatório")
    private String userId;
    
    @NotBlank(message = "Endereço de entrega é obrigatório")
    private String deliveryAddress;
    
    @NotEmpty(message = "Itens do pedido são obrigatórios")
    @Valid
    private List<OrderItemRequest> items;

    @NotNull(message = "Método de pagamento é obrigatório")
    private PaymentMethod paymentMethod;
} 