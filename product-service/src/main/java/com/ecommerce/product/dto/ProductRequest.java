package com.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Nome do produto é obrigatório")
    private String name;
    
    @NotBlank(message = "Descrição do produto é obrigatória")
    private String description;
    
    @NotNull(message = "Preço do produto é obrigatório")
    @Positive(message = "Preço deve ser maior que zero")
    private BigDecimal price;
    
    @NotNull(message = "Quantidade do produto é obrigatória")
    @Positive(message = "Quantidade deve ser maior que zero")
    private Integer quantity;
    
    private List<String> categories;
    private List<String> images;
} 