package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.Payment;
import com.ecommerce.payment.model.PaymentStatus;
import com.ecommerce.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        Payment payment = new Payment();
        payment.setOrderId(request.getOrderId());
        payment.setAmount(request.getAmount());
        payment.setStatus(PaymentStatus.PROCESSING);

        payment = paymentRepository.save(payment);

        // Simula processamento de pagamento
        try {
            Thread.sleep(2000); // Simula processamento
            payment.setStatus(PaymentStatus.COMPLETED);
        } catch (Exception e) {
            payment.setStatus(PaymentStatus.FAILED);
        }

        payment = paymentRepository.save(payment);

        // Envia mensagem para o RabbitMQ
        rabbitTemplate.convertAndSend("payment.exchange", "payment.processed", payment);

        return convertToResponse(payment);
    }

    private PaymentResponse convertToResponse(Payment payment) {
        return new PaymentResponse(
            payment.getId(),
            payment.getOrderId(),
            payment.getAmount(),
            payment.getStatus(),
            payment.getCreatedAt()
        );
    }
} 