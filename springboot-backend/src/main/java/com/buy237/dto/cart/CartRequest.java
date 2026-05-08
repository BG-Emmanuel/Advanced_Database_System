package com.buy237.dto.cart;

import lombok.Data;
import java.util.List;

@Data
public class CartRequest {
    private List<CartRequest.CartItemRequest> items;

    @Data
    public static class CartItemRequest {
        private Long productId;
        private Integer quantity;
    }
}
