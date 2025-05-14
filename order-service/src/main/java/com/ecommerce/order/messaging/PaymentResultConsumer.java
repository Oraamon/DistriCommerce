package com.ecommerce.order.messaging;

import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.dto.PaymentResponse;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import static com.ecommerce.order.config.RabbitMQConfig.PAYMENT_RESULT_QUEUE;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentResultConsumer {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;
    
    // Conjunto de status que indicam pagamento bem-sucedido
    private static final Set<String> SUCCESSFUL_PAYMENT_STATUSES = new HashSet<>(
            Arrays.asList("COMPLETED", "APPROVED", "PAID"));
    
    // Conjunto de status que indicam falha no pagamento
    private static final Set<String> FAILED_PAYMENT_STATUSES = new HashSet<>(
            Arrays.asList("FAILED", "REJECTED", "CANCELLED"));

    @RabbitListener(queues = PAYMENT_RESULT_QUEUE)
    @Transactional
    public void consumePaymentResult(PaymentResponse paymentResponse) {
        log.info("Recebendo resultado do pagamento para pedido: {}", paymentResponse.getOrderId());
        log.info("Status do pagamento: {}", paymentResponse.getStatus());
        
        if (paymentResponse.getOrderId() == null) {
            log.error("ID do pedido não informado na resposta de pagamento");
            return;
        }
        
        try {
            // Busca o pedido pelo ID
            Order order = orderRepository.findById(paymentResponse.getOrderId())
                    .orElse(null);
                    
            if (order == null) {
                log.error("Pedido não encontrado: {}", paymentResponse.getOrderId());
                return;
            }

            // Verifica o status do pagamento
            String paymentStatus = paymentResponse.getStatus();
            
            // Atualiza o status do pedido com base no status do pagamento
            if (SUCCESSFUL_PAYMENT_STATUSES.contains(paymentStatus.toUpperCase())) {
                log.info("Atualizando pedido {} para status CONFIRMED", order.getId());
                order.setStatus(OrderStatus.CONFIRMED);
                order.setPaymentId(paymentResponse.getPaymentId());
            } else if (FAILED_PAYMENT_STATUSES.contains(paymentStatus.toUpperCase())) {
                log.info("Atualizando pedido {} para status CANCELLED", order.getId());
                order.setStatus(OrderStatus.CANCELLED);
            } else {
                log.warn("Status de pagamento desconhecido: {}, mantendo status atual do pedido", paymentStatus);
            }

            Order savedOrder = orderRepository.save(order);
            log.info("Pedido atualizado com sucesso: {}, status: {}", savedOrder.getId(), savedOrder.getStatus());
        } catch (Exception e) {
            log.error("Erro ao processar resultado do pagamento para pedido: {}, erro: {}", 
                    paymentResponse.getOrderId(), e.getMessage());
        }
    }
} 