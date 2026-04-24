package com.buy237.dto.order;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long id;
    private Long userId;
    private Double totalAmount;
    private String status;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
}

@Data
class OrderItemResponse {
    private Long productId;
    private Integer quantity;
    private Double price;
}
