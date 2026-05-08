package com.buy237.dto.order;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private List<OrderRequest.OrderItemRequest> items;
    private Double totalAmount;

    @Data
    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;
        private Double price;
    }
}
