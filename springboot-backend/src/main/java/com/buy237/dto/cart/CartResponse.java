package com.buy237.dto.cart;

import lombok.Data;
import java.util.List;

@Data
public class CartResponse {
    private Long id;
    private Long userId;
    private List<CartItemResponse> items;
}

@Data
class CartItemResponse {
    private Long productId;
    private Integer quantity;
}
