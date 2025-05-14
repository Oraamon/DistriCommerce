package com.ecommerce.product.messaging;

import com.ecommerce.product.dto.OrderItemDto;
import com.ecommerce.product.dto.PaymentEvent;
import com.ecommerce.product.service.ProductService;
import com.ecommerce.product.service.StockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.ecommerce.product.config.RabbitMQConfig.PAYMENT_PROCESSED_QUEUE;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {

    private final StockService stockService;
    private final ProductService productService;

    @RabbitListener(queues = PAYMENT_PROCESSED_QUEUE)
    public void handlePaymentEvent(PaymentEvent paymentEvent) {
        log.info("Recebido evento de pagamento: {}", paymentEvent);
        
        String status = paymentEvent.getStatus();
        String orderId = paymentEvent.getOrderId();
        List<OrderItemDto> orderItems = paymentEvent.getOrderItems();
        
        if (orderItems != null && !orderItems.isEmpty()) {
            log.info("Processando {} itens do pedido {}", orderItems.size(), orderId);
            
            switch (status) {
                case "COMPLETED":
                    processCompletedPaymentWithItems(orderItems);
                    break;
                case "FAILED":
                    // Nada a fazer para pagamento falho
                    log.info("Pagamento falhou, nenhuma alteração no estoque necessária");
                    break;
                case "REFUNDED":
                    processRefundedPaymentWithItems(orderItems);
                    break;
                default:
                    log.info("Status de pagamento {} não requer ajuste de estoque", status);
            }
        } else {
            log.warn("Evento de pagamento sem itens. Usando serviço de pedidos como fallback");
            
            // Fallback para o método antigo
            switch (status) {
                case "COMPLETED":
                    stockService.processCompletedPayment(orderId);
                    break;
                case "FAILED":
                    stockService.processFailedPayment(orderId);
                    break;
                case "REFUNDED":
                    stockService.processRefundedPayment(orderId);
                    break;
                default:
                    log.info("Status de pagamento {} não requer ajuste de estoque", status);
            }
        }
    }
    
    private void processCompletedPaymentWithItems(List<OrderItemDto> orderItems) {
        for (OrderItemDto item : orderItems) {
            try {
                boolean success = productService.decreaseStock(item.getProductId(), item.getQuantity());
                if (success) {
                    log.info("Estoque diminuído para o produto {} em {} unidades", item.getProductId(), item.getQuantity());
                } else {
                    log.warn("Falha ao diminuir estoque para o produto {}", item.getProductId());
                }
            } catch (Exception e) {
                log.error("Erro ao processar diminuição de estoque para o produto {}: {}", item.getProductId(), e.getMessage());
            }
        }
    }
    
    private void processRefundedPaymentWithItems(List<OrderItemDto> orderItems) {
        for (OrderItemDto item : orderItems) {
            try {
                boolean success = productService.increaseStock(item.getProductId(), item.getQuantity());
                if (success) {
                    log.info("Estoque aumentado para o produto {} em {} unidades", item.getProductId(), item.getQuantity());
                } else {
                    log.warn("Falha ao aumentar estoque para o produto {}", item.getProductId());
                }
            } catch (Exception e) {
                log.error("Erro ao processar aumento de estoque para o produto {}: {}", item.getProductId(), e.getMessage());
            }
        }
    }
} 