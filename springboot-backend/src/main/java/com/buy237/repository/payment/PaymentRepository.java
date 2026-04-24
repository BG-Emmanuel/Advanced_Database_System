package com.buy237.repository.payment;

import com.buy237.model.payment.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOrderId(Long orderId);
}
