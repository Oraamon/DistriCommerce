package com.ecommerce.payment.service.impl;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.Payment;
import com.ecommerce.payment.model.PaymentStatus;
import com.ecommerce.payment.repository.PaymentRepository;
import com.ecommerce.payment.service.PaymentService;
import com.ecommerce.payment.service.impl.gateway.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.ecommerce.payment.config.RabbitMQConfig.PAYMENT_RESULT_EXCHANGE;
import static com.ecommerce.payment.config.RabbitMQConfig.PAYMENT_RESULT_ROUTING_KEY;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentGatewayService paymentGatewayService;
    private final RabbitTemplate rabbitTemplate;

    @Override
    @Transactional
    public PaymentResponse processPayment(PaymentRequest paymentRequest) {
        Payment payment = Payment.builder()
                .orderId(paymentRequest.getOrderId())
                .userId(paymentRequest.getUserId())
                .amount(paymentRequest.getAmount())
                .status(PaymentStatus.PROCESSING)
                .paymentMethod(paymentRequest.getPaymentMethod())
                .paymentDate(LocalDateTime.now())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        try {
            boolean isPaymentSuccessful = paymentGatewayService.processPayment(paymentRequest);
            
            if (isPaymentSuccessful) {
                savedPayment.setStatus(PaymentStatus.COMPLETED);
                savedPayment.setTransactionId(UUID.randomUUID().toString());
            } else {
                savedPayment.setStatus(PaymentStatus.FAILED);
                savedPayment.setErrorMessage("Falha no processamento do pagamento");
            }
        } catch (Exception e) {
            savedPayment.setStatus(PaymentStatus.FAILED);
            savedPayment.setErrorMessage(e.getMessage());
        }

        Payment updatedPayment = paymentRepository.save(savedPayment);
        
        PaymentResponse paymentResponse = mapToPaymentResponse(updatedPayment);
        rabbitTemplate.convertAndSend(PAYMENT_RESULT_EXCHANGE, PAYMENT_RESULT_ROUTING_KEY, paymentResponse);
        
        return paymentResponse;
    }

    @Override
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado com id: " + id));
        return mapToPaymentResponse(payment);
    }

    @Override
    public PaymentResponse getPaymentByOrderId(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado para o pedido: " + orderId));
        return mapToPaymentResponse(payment);
    }

    @Override
    public List<PaymentResponse> getPaymentsByUserId(String userId) {
        List<Payment> payments = paymentRepository.findByUserId(userId);
        return payments.stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pagamento não encontrado com id: " + id));
        
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new RuntimeException("Apenas pagamentos completados podem ser reembolsados");
        }
        
        boolean isRefundSuccessful = paymentGatewayService.refundPayment(payment.getTransactionId());
        
        if (isRefundSuccessful) {
            payment.setStatus(PaymentStatus.REFUNDED);
            Payment updatedPayment = paymentRepository.save(payment);
            return mapToPaymentResponse(updatedPayment);
        } else {
            throw new RuntimeException("Falha ao processar o reembolso");
        }
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .transactionId(payment.getTransactionId())
                .paymentDate(payment.getPaymentDate())
                .errorMessage(payment.getErrorMessage())
                .build();
    }
} 