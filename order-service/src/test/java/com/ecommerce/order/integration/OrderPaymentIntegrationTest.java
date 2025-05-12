package com.ecommerce.order.integration;

import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Collections;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class OrderPaymentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    public void testCreateOrderAndProcessPayment() throws Exception {
        // Criar pedido de teste
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setUserId("test-user");
        orderRequest.setItems(Collections.singletonList(
                new OrderRequest.OrderItemDto("product1", 2)
        ));
        orderRequest.setShippingAddress("Endereço de Teste, 123");
        orderRequest.setPaymentMethod("CREDIT_CARD");

        // Enviar requisição para criar pedido
        MvcResult result = mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(orderRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        // Extrair ID do pedido da resposta
        String responseJson = result.getResponse().getContentAsString();
        Long orderId = objectMapper.readTree(responseJson).get("id").asLong();

        // Verificar se o pedido foi criado corretamente
        Order order = orderRepository.findById(orderId).orElse(null);
        assertNotNull(order, "Pedido não encontrado no banco de dados");
        assertEquals("test-user", order.getUserId(), "ID do usuário no pedido não corresponde ao esperado");
        assertEquals(2, order.getItems().size(), "Número de itens no pedido não corresponde ao esperado");
        assertEquals("Endereço de Teste, 123", order.getShippingAddress(), "Endereço de entrega no pedido não corresponde ao esperado");
        assertEquals("CREDIT_CARD", order.getPaymentMethod(), "Método de pagamento no pedido não corresponde ao esperado");
    }
} 