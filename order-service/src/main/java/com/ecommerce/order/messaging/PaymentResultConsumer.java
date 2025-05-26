package com.ecommerce.order.messaging;

import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.dto.PaymentResponse;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

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
    private final RabbitTemplate rabbitTemplate;
    
    // Conjunto de status que indicam pagamento bem-sucedido
    private static final Set<String> SUCCESSFUL_PAYMENT_STATUSES = new HashSet<>(
            Arrays.asList("COMPLETED", "APPROVED", "PAID"));
    
    // Conjunto de status que indicam falha no pagamento
    private static final Set<String> FAILED_PAYMENT_STATUSES = new HashSet<>(
            Arrays.asList("FAILED", "REJECTED", "CANCELLED"));

    @RabbitListener(queues = PAYMENT_RESULT_QUEUE)
    @Transactional
    public void consumePaymentResult(PaymentResponse paymentResponse) {
        log.info("==========================================================");
        log.info("RECEBENDO RESULTADO DO PAGAMENTO");
        log.info("Dados recebidos: {}", paymentResponse);
        log.info("ID do pedido: {}", paymentResponse.getOrderId());
        log.info("Status do pagamento: {}", paymentResponse.getStatus());
        log.info("==========================================================");
        
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

            log.info("Pedido encontrado: {}, status atual: {}", order.getId(), order.getStatus());

            // Verifica o status do pagamento
            String paymentStatus = paymentResponse.getStatus();
            
            // Imprime todos os status para debug
            log.info("Status do pagamento original: '{}'", paymentStatus);
            log.info("Status do pagamento uppercase: '{}'", paymentStatus.toUpperCase());
            log.info("Status de sucesso disponíveis: {}", SUCCESSFUL_PAYMENT_STATUSES);
            log.info("Status de falha disponíveis: {}", FAILED_PAYMENT_STATUSES);
            log.info("É um status de sucesso? {}", SUCCESSFUL_PAYMENT_STATUSES.contains(paymentStatus.toUpperCase()));
            
            // Atualiza o status do pedido com base no status do pagamento
            boolean statusUpdated = false;
            
            if (SUCCESSFUL_PAYMENT_STATUSES.contains(paymentStatus.toUpperCase())) {
                log.info("Atualizando pedido {} para status CONFIRMED", order.getId());
                order.setStatus(OrderStatus.CONFIRMED);
                order.setPaymentId(paymentResponse.getPaymentId());
                statusUpdated = true;
                
                // Enviar notificação de pagamento aprovado
                sendPaymentNotification(order.getUserId(), "payment_approved", 
                    String.format("Pagamento do pedido #%d foi aprovado! Seu pedido está sendo processado.", order.getId()));
                    
            } else if (FAILED_PAYMENT_STATUSES.contains(paymentStatus.toUpperCase())) {
                log.info("Atualizando pedido {} para status CANCELLED", order.getId());
                order.setStatus(OrderStatus.CANCELLED);
                statusUpdated = true;
                
                // Enviar notificação de pagamento rejeitado
                sendPaymentNotification(order.getUserId(), "payment_failed", 
                    String.format("Pagamento do pedido #%d foi rejeitado. Tente novamente ou use outro método de pagamento.", order.getId()));
                    
            } else {
                log.warn("Status de pagamento desconhecido: {}, mantendo status atual do pedido", paymentStatus);
            }

            if (statusUpdated) {
                Order savedOrder = orderRepository.save(order);
                log.info("Pedido atualizado com sucesso: {}, status antigo: {}, novo status: {}", 
                        savedOrder.getId(), 
                        paymentStatus,
                        savedOrder.getStatus());
            } else {
                log.warn("Nenhuma atualização de status realizada para o pedido: {}", order.getId());
            }
        } catch (Exception e) {
            log.error("Erro ao processar resultado do pagamento para pedido: {}, erro: {}", 
                    paymentResponse.getOrderId(), e.getMessage(), e);
        }
    }
    
    // Método para monitorar se as mensagens estão sendo entregues
    @Scheduled(fixedRate = 60000) // Executa a cada 1 minuto
    public void checkQueue() {
        log.info("Verificando status da fila de pagamentos: {}", PAYMENT_RESULT_QUEUE);
        try {
            // Apenas para registrar que o agendador está funcionando
            int orderCount = orderRepository.findAll().size();
            log.info("Total de pedidos no sistema: {}", orderCount);
        } catch (Exception e) {
            log.error("Erro ao verificar fila: {}", e.getMessage());
        }
    }

    private void sendPaymentNotification(String userId, String action, String message) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("userId", Long.valueOf(userId));
            notification.put("action", action);
            notification.put("message", message);
            notification.put("timestamp", LocalDateTime.now().toString());

            rabbitTemplate.convertAndSend(
                "order.notification.exchange",
                "order.notification.key",
                notification
            );

            log.info("Notificação de pagamento enviada para usuário {}: {}", userId, action);
        } catch (Exception e) {
            log.error("Erro ao enviar notificação de pagamento: {}", e.getMessage());
        }
    }
}