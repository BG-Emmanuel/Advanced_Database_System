package com.buy237.controller.payment;

import com.buy237.dto.payment.PaymentRequest;
import com.buy237.dto.payment.PaymentResponse;
import com.buy237.service.payment.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    @Autowired
    private PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@RequestBody PaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByOrder(@PathVariable Long orderId) {
        List<PaymentResponse> payments = paymentService.getPaymentsByOrder(orderId);
        return ResponseEntity.ok(payments);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable Long paymentId) {
        PaymentResponse payment = paymentService.getPaymentById(paymentId);
        return ResponseEntity.ok(payment);
    }

    @PutMapping("/{paymentId}/status")
    public ResponseEntity<Void> updatePaymentStatus(@PathVariable Long paymentId, @RequestParam String status) {
        paymentService.updatePaymentStatus(paymentId, status);
        return ResponseEntity.noContent().build();
    }
}
