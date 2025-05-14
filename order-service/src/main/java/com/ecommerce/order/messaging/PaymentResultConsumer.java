package com.ecommerce.order.messaging;

import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.dto.PaymentResponse;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.model.PaymentStatus;
import com.ecommerce.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import static com.ecommerce.order.config.RabbitMQConfig.PAYMENT_RESULT_QUEUE;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentResultConsumer {

    private final OrderRepository orderRepository;
    private final ProductClient productClient;

    @RabbitListener(queues = PAYMENT_RESULT_QUEUE)
    @Transactional
    public void consumePaymentResult(PaymentResponse paymentResponse) {
        log.info("Recebendo resultado do pagamento para pedido: {}", paymentResponse.getOrderId());
        log.info("Status do pagamento: {}", paymentResponse.getStatus());
        
        try {
            Order order = orderRepository.findById(paymentResponse.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Pedido não encontrado: " + paymentResponse.getOrderId()));

            if (PaymentStatus.COMPLETED.name().equals(paymentResponse.getStatus())) {
                log.info("Atualizando pedido {} para status CONFIRMED", order.getId());
                order.setStatus(OrderStatus.CONFIRMED);
                order.setPaymentStatus(PaymentStatus.COMPLETED);
            } else if (PaymentStatus.FAILED.name().equals(paymentResponse.getStatus())) {
                log.info("Atualizando pedido {} para status CANCELED", order.getId());
                order.setStatus(OrderStatus.CANCELED);
                order.setPaymentStatus(PaymentStatus.FAILED);
            }

            Order savedOrder = orderRepository.save(order);
            log.info("Pedido atualizado com sucesso: {}, status: {}", savedOrder.getId(), savedOrder.getStatus());
        } catch (Exception e) {
            log.error("Erro ao processar resultado do pagamento para pedido: {}", paymentResponse.getOrderId(), e);
            throw e;
        }
    }
} 