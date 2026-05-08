package com.buy237.dto.order;

import lombok.Data;

@Data
public class OrderItemResponse {
    private Long productId;
    private Integer quantity;
    private Double price;
}
