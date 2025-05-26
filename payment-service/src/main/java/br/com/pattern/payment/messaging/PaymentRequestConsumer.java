package br.com.pattern.payment.messaging;

import br.com.pattern.payment.config.RabbitMQConfig;
import br.com.pattern.payment.dto.PaymentRequest;
import br.com.pattern.payment.service.PaymentService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentRequestConsumer {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_QUEUE)
    public void consumePaymentRequest(String paymentRequestJson) {
        log.info("Recebendo solicitação de pagamento: {}", paymentRequestJson);
        try {
            JsonNode paymentNode = objectMapper.readTree(paymentRequestJson);
            
            PaymentRequest paymentRequest = new PaymentRequest();
            
            if (paymentNode.has("orderId")) {
                Object orderIdValue = paymentNode.get("orderId");
                if (orderIdValue != null) {
                    paymentRequest.setOrderId(paymentNode.get("orderId").asText());
                }
            }
            
            if (paymentNode.has("userId")) {
                paymentRequest.setUserId(paymentNode.get("userId").asText());
            }
            
            if (paymentNode.has("amount")) {
                paymentRequest.setAmount(new BigDecimal(paymentNode.get("amount").asText()));
            }
            
            if (paymentNode.has("paymentMethod")) {
                paymentRequest.setPaymentMethod(paymentNode.get("paymentMethod").asText());
            }
            
            log.info("Processando pagamento para o pedido: {}", paymentRequest.getOrderId());
            paymentService.processPayment(paymentRequest);
            log.info("Pagamento processado com sucesso para o pedido: {}", paymentRequest.getOrderId());
        } catch (Exception e) {
            log.error("Erro ao processar solicitação de pagamento: {}", e.getMessage(), e);
            throw new RuntimeException("Erro ao processar pagamento", e);
        }
    }
} 