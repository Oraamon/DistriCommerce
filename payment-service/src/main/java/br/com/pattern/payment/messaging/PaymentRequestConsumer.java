package br.com.pattern.payment.messaging;

import br.com.pattern.payment.config.RabbitMQConfig;
import br.com.pattern.payment.dto.PaymentRequest;
import br.com.pattern.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentRequestConsumer {

    private final PaymentService paymentService;

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_QUEUE)
    public void consumePaymentRequest(PaymentRequest paymentRequest) {
        log.info("Recebendo solicitação de pagamento para o pedido: {}", paymentRequest.getOrderId());
        try {
            paymentService.processPayment(paymentRequest);
            log.info("Pagamento processado com sucesso para o pedido: {}", paymentRequest.getOrderId());
        } catch (Exception e) {
            log.error("Erro ao processar pagamento para o pedido: {}", paymentRequest.getOrderId(), e);
            throw e;
        }
    }
} 