package com.example.ecommerce.init;

import com.example.ecommerce.model.Product;
import com.example.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Autowired
    public DataInitializer(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() == 0) {
            List<Product> demoProducts = Arrays.asList(
                new Product(
                    "Smartphone Galaxy S21",
                    "Smartphone Samsung Galaxy S21 com 128GB de armazenamento, 8GB de RAM e câmera de 64MP.",
                    new BigDecimal("3999.99"),
                    "https://placehold.co/300x200?text=Galaxy+S21",
                    15
                ),
                new Product(
                    "Notebook Dell Inspiron",
                    "Notebook Dell Inspiron com processador Intel Core i7, 16GB de RAM e SSD de 512GB.",
                    new BigDecimal("4599.99"),
                    "https://placehold.co/300x200?text=Dell+Inspiron",
                    8
                ),
                new Product(
                    "Smart TV LG 55\"",
                    "Smart TV LG 55\" 4K UHD com HDR, webOS e controle por voz.",
                    new BigDecimal("2899.99"),
                    "https://placehold.co/300x200?text=LG+TV",
                    12
                ),
                new Product(
                    "Fone de Ouvido Sony WH-1000XM4",
                    "Fone de ouvido sem fio com cancelamento de ruído, 30 horas de bateria e conexão Bluetooth.",
                    new BigDecimal("1799.99"),
                    "https://placehold.co/300x200?text=Sony+WH-1000XM4",
                    20
                ),
                new Product(
                    "Mouse Gamer Logitech G502",
                    "Mouse gamer com sensor HERO 25K, pesos ajustáveis e 11 botões programáveis.",
                    new BigDecimal("349.90"),
                    "https://placehold.co/300x200?text=Logitech+G502",
                    30
                )
            );
            
            productRepository.saveAll(demoProducts);
            System.out.println(">>> Dados de exemplo foram adicionados ao banco de dados.");
        }
    }
} 