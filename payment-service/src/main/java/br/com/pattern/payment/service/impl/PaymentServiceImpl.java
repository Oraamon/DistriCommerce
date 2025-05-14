package br.com.pattern.payment.service.impl;

import br.com.pattern.payment.config.RabbitMQConfig;
import br.com.pattern.payment.dto.PaymentRequest;
import br.com.pattern.payment.dto.PaymentResponse;
import br.com.pattern.payment.model.Payment;
import br.com.pattern.payment.model.PaymentStatus;
import br.com.pattern.payment.repository.PaymentRepository;
import br.com.pattern.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final RabbitTemplate rabbitTemplate;
    private final RestTemplate restTemplate;

    @Override
    public PaymentResponse processPayment(PaymentRequest request) {
        log.info("Processando pagamento para o pedido: {}", request.getOrderId());
        
        String orderId = request.getOrderId();
        boolean shouldCreateOrder = false;
        
        // Verifica se é necessário criar um pedido primeiro
        if (orderId == null || orderId.isEmpty()) {
            // Caso 1: OrderId não foi fornecido, sempre cria um novo pedido
            shouldCreateOrder = true;
            log.info("OrderId não fornecido. Criando novo pedido.");
        } else {
            // Caso 2: OrderId foi fornecido, verifica se existe
            try {
                // Tentativa de verificar se o pedido existe
                String orderCheckUrl = "http://order-service:8082/api/orders/" + orderId;
                restTemplate.getForObject(orderCheckUrl, String.class);
                log.info("Pedido {} encontrado. Processando pagamento.", orderId);
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                    // Pedido não existe, criar um novo
                    log.warn("Pedido {} não encontrado. Criando novo pedido.", orderId);
                    shouldCreateOrder = true;
                } else {
                    log.error("Erro ao verificar pedido: {}", e.getMessage());
                }
            } catch (Exception e) {
                log.warn("Erro ao verificar pedido: {}. Criando novo pedido.", e.getMessage());
                shouldCreateOrder = true;
            }
        }
        
        if (shouldCreateOrder) {
            try {
                // Criar pedido via API do serviço de pedidos
                log.info("Criando novo pedido para o pagamento");
                orderId = createOrderViaAPI(request);
                log.info("Pedido criado com sucesso: {}", orderId);
            } catch (Exception e) {
                // Fallback: se falhar ao criar o pedido, gera um ID temporário
                log.warn("Erro ao criar pedido: {}. Usando fallback com ID temporário", e.getMessage());
                orderId = "temp-" + UUID.randomUUID().toString();
            }
        }
        
        Payment payment = new Payment();
        payment.setOrderId(orderId);
        payment.setAmount(request.getAmount());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setTransactionId(UUID.randomUUID().toString());
        payment.setCreatedAt(LocalDateTime.now());
        payment.setPaymentDate(LocalDateTime.now());
        
        // Definir userId com o valor do request, ou usar "anonymous" como fallback
        payment.setUserId(request.getUserId() != null ? request.getUserId() : "anonymous");

        payment = paymentRepository.save(payment);
        log.info("Pagamento salvo com status PENDING: {}", payment.getId());

        // Simula processamento do pagamento
        payment.setStatus(PaymentStatus.APPROVED);
        payment = paymentRepository.save(payment);
        log.info("Pagamento atualizado para status APPROVED: {}", payment.getId());

        // Constrói a resposta de pagamento
        PaymentResponse response = mapToResponse(payment);
        
        try {
            // Envia mensagem para o RabbitMQ usando a configuração correta
            log.info("Enviando resultado do pagamento para o exchange: {}, routing key: {}", 
                    RabbitMQConfig.PAYMENT_RESULT_EXCHANGE, 
                    RabbitMQConfig.PAYMENT_RESULT_ROUTING_KEY);
            
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.PAYMENT_RESULT_EXCHANGE, 
                    RabbitMQConfig.PAYMENT_RESULT_ROUTING_KEY, 
                    response);
        } catch (Exception e) {
            log.error("Erro ao enviar resultado do pagamento para o RabbitMQ: {}", e.getMessage());
            // Continua o fluxo mesmo com erro no envio para o RabbitMQ
        }

        return response;
    }
    
    private String createOrderViaAPI(PaymentRequest request) {
        try {
            log.info("Tentando criar pedido via API");
            
            // Preparar cabeçalhos
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Preparar o body da requisição - este é um exemplo simplificado
            String orderRequestJson = createOrderRequestJson(request);
            
            HttpEntity<String> entity = new HttpEntity<>(orderRequestJson, headers);
            
            // Enviar requisição para o serviço de pedidos
            String orderServiceUrl = "http://order-service:8082/api/orders/simple";
            String response = restTemplate.postForObject(orderServiceUrl, entity, String.class);
            
            log.info("Pedido criado com sucesso: {}", response);
            
            // Extrair o ID do pedido da resposta
            // Este é um exemplo simples - em produção, você deveria fazer um parsing adequado do JSON
            String orderId = extractOrderIdFromResponse(response);
            
            return orderId;
        } catch (Exception e) {
            log.error("Erro ao criar pedido via API: {}", e.getMessage());
            throw new RuntimeException("Falha ao criar pedido: " + e.getMessage());
        }
    }
    
    private String createOrderRequestJson(PaymentRequest request) {
        // Simplificado para o exemplo - em produção, use uma biblioteca JSON adequada
        return "{"
                + "\"userId\":\"" + (request.getUserId() != null ? request.getUserId() : "anonymous") + "\","
                + "\"deliveryAddress\":\"" + (request.getDeliveryAddress() != null ? request.getDeliveryAddress() : "Endereço não informado") + "\","
                + "\"paymentMethod\":\"" + request.getPaymentMethod() + "\","
                + "\"items\":" + (request.getItems() != null ? request.getItems() : "[{\"productId\":\"default-product\",\"quantity\":1}]")
                + "}";
    }
    
    private String extractOrderIdFromResponse(String response) {
        // Implementação simplificada
        // Em produção, use uma biblioteca JSON como Jackson ou Gson
        int idIndex = response.indexOf("\"id\":");
        if (idIndex >= 0) {
            int startIndex = response.indexOf(':', idIndex) + 1;
            int endIndex = response.indexOf(',', startIndex);
            if (endIndex < 0) {
                endIndex = response.indexOf('}', startIndex);
            }
            
            if (startIndex >= 0 && endIndex >= 0) {
                return response.substring(startIndex, endIndex).trim().replaceAll("\"", "");
            }
        }
        return UUID.randomUUID().toString(); // Fallback com UUID
    }

    @Override
    public PaymentResponse getPaymentByOrderId(String orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId);
        return payment != null ? mapToResponse(payment) : null;
    }

    private PaymentResponse mapToResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse();
        response.setPaymentId(payment.getId().toString());
        response.setOrderId(payment.getOrderId());
        response.setAmount(payment.getAmount());
        response.setStatus(payment.getStatus().toString());
        response.setPaymentMethod(payment.getPaymentMethod());
        response.setTransactionId(payment.getTransactionId());
        response.setPaymentDate(payment.getPaymentDate());
        response.setErrorMessage(payment.getErrorMessage());
        return response;
    }
} 