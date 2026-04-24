package com.buy237.dto.payment;

import lombok.Data;

@Data
public class PaymentRequest {
    private Long orderId;
    private Double amount;
    private String method;
}
