package com.buy237.dto.cart;

import lombok.Data;
import java.util.List;

@Data
public class CartRequest {
    private List<CartItemRequest> items;
}

@Data
class CartItemRequest {
    private Long productId;
    private Integer quantity;
}
