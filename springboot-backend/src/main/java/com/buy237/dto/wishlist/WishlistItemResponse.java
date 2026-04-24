package com.buy237.dto.wishlist;

import lombok.Data;

@Data
public class WishlistItemResponse {
    private Long id;
    private Long userId;
    private Long productId;
}
