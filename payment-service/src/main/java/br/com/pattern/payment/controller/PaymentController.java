package br.com.pattern.payment.controller;

import br.com.pattern.payment.dto.PaymentRequest;
import br.com.pattern.payment.dto.PaymentResponse;
import br.com.pattern.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> processPayment(@RequestBody PaymentRequest request) {
        return ResponseEntity.ok(paymentService.processPayment(request));
    }
    
    @PostMapping("/direct")
    public ResponseEntity<PaymentResponse> processDirectPayment(@RequestBody PaymentRequest request) {
        // Para pagamentos diretos, garantimos que não há orderId
        request.setOrderId(null);
        return ResponseEntity.ok(paymentService.processPayment(request));
    }
    
    @PostMapping("/refund/{orderId}")
    public ResponseEntity<PaymentResponse> refundPayment(@PathVariable String orderId) {
        return ResponseEntity.ok(paymentService.refundPayment(orderId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<PaymentResponse> getPaymentByOrderId(@PathVariable String orderId) {
        PaymentResponse payment = paymentService.getPaymentByOrderId(orderId);
        return payment != null ? ResponseEntity.ok(payment) : ResponseEntity.notFound().build();
    }
    
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testEndpoint() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Payment service is running");
        return ResponseEntity.ok(response);
    }
} 