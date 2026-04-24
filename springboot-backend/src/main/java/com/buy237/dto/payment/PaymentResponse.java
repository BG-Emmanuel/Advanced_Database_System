package com.buy237.dto.payment;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private Double amount;
    private String method;
    private String status;
    private LocalDateTime createdAt;
}
