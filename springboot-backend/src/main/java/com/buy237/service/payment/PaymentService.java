package com.buy237.service.payment;

import com.buy237.model.payment.Payment;
import com.buy237.repository.payment.PaymentRepository;
import com.buy237.dto.payment.PaymentRequest;
import com.buy237.dto.payment.PaymentResponse;
import com.buy237.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;

    public PaymentResponse createPayment(PaymentRequest request) {
        Payment payment = Payment.builder()
                .orderId(request.getOrderId())
                .amount(request.getAmount())
                .method(request.getMethod())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        payment = paymentRepository.save(payment);
        return toPaymentResponse(payment);
    }

    public List<PaymentResponse> getPaymentsByOrder(Long orderId) {
        return paymentRepository.findByOrderId(orderId).stream().map(this::toPaymentResponse).collect(Collectors.toList());
    }

    public PaymentResponse getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        return toPaymentResponse(payment);
    }

    public void updatePaymentStatus(Long paymentId, String status) {
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        payment.setStatus(status);
        paymentRepository.save(payment);
    }

    private PaymentResponse toPaymentResponse(Payment payment) {
        PaymentResponse resp = new PaymentResponse();
        resp.setId(payment.getId());
        resp.setOrderId(payment.getOrderId());
        resp.setAmount(payment.getAmount());
        resp.setMethod(payment.getMethod());
        resp.setStatus(payment.getStatus());
        resp.setCreatedAt(payment.getCreatedAt());
        return resp;
    }
}
