package com.ecommerce.payment.messaging;

import com.ecommerce.payment.dto.PaymentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import static com.ecommerce.payment.config.RabbitMQConfig.PAYMENT_LOG_QUEUE;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentResultConsumer {

    @RabbitListener(queues = PAYMENT_LOG_QUEUE)
    public void consumePaymentResult(PaymentResponse paymentResponse) {
        log.info("Recebendo resultado do pagamento para pedido: {}", paymentResponse.getOrderId());
        log.info("Status do pagamento: {}", paymentResponse.getStatus());
        
        if (paymentResponse.getStatus().name().equals("FAILED")) {
            log.error("Pagamento falhou para pedido: {}. Motivo: {}", 
                paymentResponse.getOrderId(), 
                paymentResponse.getErrorMessage());
        } else if (paymentResponse.getStatus().name().equals("COMPLETED")) {
            log.info("Pagamento concluído com sucesso para pedido: {}. ID da transação: {}", 
                paymentResponse.getOrderId(), 
                paymentResponse.getTransactionId());
        }
    }
} 