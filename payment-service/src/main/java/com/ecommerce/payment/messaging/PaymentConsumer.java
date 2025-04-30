package com.ecommerce.payment.messaging;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import static com.ecommerce.payment.config.RabbitMQConfig.PAYMENT_QUEUE;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentConsumer {

    private final PaymentService paymentService;

    @RabbitListener(queues = PAYMENT_QUEUE)
    public void consumePaymentMessage(PaymentRequest paymentRequest) {
        log.info("Recebendo solicitação de pagamento para pedido: {}", paymentRequest.getOrderId());
        try {
            paymentService.processPayment(paymentRequest);
            log.info("Pagamento processado com sucesso para pedido: {}", paymentRequest.getOrderId());
        } catch (Exception e) {
            log.error("Erro ao processar pagamento para pedido: {}", paymentRequest.getOrderId(), e);
        }
    }
} 