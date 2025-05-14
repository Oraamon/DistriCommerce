package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.Payment;
import com.ecommerce.payment.model.PaymentStatus;
import com.ecommerce.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processando pagamento para o pedido: {}", request.getOrderId());
        
        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setAmount(request.getAmount());
        payment.setStatus(PaymentStatus.PROCESSING);
        
        // Define o método de pagamento, usando um valor padrão se não for informado
        String paymentMethod = request.getPaymentMethod();
        if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
            paymentMethod = "CREDIT_CARD"; // Valor padrão
            log.warn("Método de pagamento não informado. Usando valor padrão: {}", paymentMethod);
        }
        payment.setPaymentMethod(paymentMethod);

        payment = paymentRepository.save(payment);

        // Simula processamento de pagamento
        try {
            Thread.sleep(2000); // Simula processamento
            payment.setStatus(PaymentStatus.COMPLETED);
            log.info("Pagamento concluído com sucesso para o pedido: {}", request.getOrderId());
        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
            log.error("Falha no processamento do pagamento para o pedido: {}", request.getOrderId());
        }

        payment = paymentRepository.save(payment);

        // Envia mensagem para o RabbitMQ com informações adicionais de itens do pedido
        Map<String, Object> paymentEvent = createPaymentEvent(payment, request);
        log.info("Enviando evento de pagamento para a fila: {}", payment.getStatus());
        rabbitTemplate.convertAndSend("payment.exchange", "payment.processed", paymentEvent);

        return convertToResponse(payment);
    }
    
    @Transactional
    public PaymentResponse refundPayment(String orderId) {
        log.info("Processando reembolso para o pedido: {}", orderId);
        
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado para o pedido: " + orderId));
        
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            payment.setStatus(PaymentStatus.REFUNDED);
            payment = paymentRepository.save(payment);
            
            // Envia mensagem para o RabbitMQ sobre o reembolso
            Map<String, Object> paymentEvent = createRefundPaymentEvent(payment);
            log.info("Enviando evento de reembolso de pagamento para a fila");
            rabbitTemplate.convertAndSend("payment.exchange", "payment.processed", paymentEvent);
            
            return convertToResponse(payment);
        } else {
            throw new RuntimeException("Só é possível reembolsar pagamentos com status COMPLETED");
        }
    }
    
    private Map<String, Object> createPaymentEvent(Payment payment, PaymentRequest request) {
        Map<String, Object> event = new HashMap<>();
        event.put("id", payment.getId());
        event.put("orderId", payment.getOrderId());
        event.put("amount", payment.getAmount());
        event.put("status", payment.getStatus().toString());
        event.put("paymentMethod", payment.getPaymentMethod());
        event.put("createdAt", payment.getCreatedAt());
        
        // Adicionar os itens do pedido se disponíveis
        if (request.getOrderItems() != null && !request.getOrderItems().isEmpty()) {
            event.put("orderItems", request.getOrderItems());
            log.info("Incluindo {} itens no evento de pagamento", request.getOrderItems().size());
        } else {
            log.warn("Nenhum item do pedido fornecido para o evento de pagamento");
        }
        
        return event;
    }
    
    private Map<String, Object> createRefundPaymentEvent(Payment payment) {
        Map<String, Object> event = new HashMap<>();
        event.put("id", payment.getId());
        event.put("orderId", payment.getOrderId());
        event.put("amount", payment.getAmount());
        event.put("status", payment.getStatus().toString());
        event.put("paymentMethod", payment.getPaymentMethod());
        event.put("createdAt", payment.getCreatedAt());
        return event;
    }

    private PaymentResponse convertToResponse(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getOrderId(),
            payment.getAmount(),
            payment.getStatus(),
            payment.getPaymentMethod(),
            payment.getCreatedAt()
        );
    }
} 