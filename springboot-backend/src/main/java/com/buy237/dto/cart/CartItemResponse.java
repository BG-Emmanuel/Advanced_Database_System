package com.buy237.dto.cart;

import lombok.Data;

@Data
public class CartItemResponse {
    private Long productId;
    private Integer quantity;
}
