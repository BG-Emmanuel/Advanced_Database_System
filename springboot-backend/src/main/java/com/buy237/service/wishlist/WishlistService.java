package com.buy237.service.wishlist;

import com.buy237.model.wishlist.WishlistItem;
import com.buy237.repository.wishlist.WishlistItemRepository;
import com.buy237.dto.wishlist.WishlistItemResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {
    @Autowired
    private WishlistItemRepository wishlistItemRepository;

    public List<WishlistItemResponse> getWishlist(Long userId) {
        return wishlistItemRepository.findByUserId(userId).stream().map(this::toWishlistItemResponse).collect(Collectors.toList());
    }

    public void addToWishlist(Long userId, Long productId) {
        if (!wishlistItemRepository.existsByUserIdAndProductId(userId, productId)) {
            WishlistItem item = WishlistItem.builder().userId(userId).productId(productId).build();
            wishlistItemRepository.save(item);
        }
    }

    public void removeFromWishlist(Long userId, Long productId) {
        wishlistItemRepository.deleteByUserIdAndProductId(userId, productId);
    }

    private WishlistItemResponse toWishlistItemResponse(WishlistItem item) {
        WishlistItemResponse resp = new WishlistItemResponse();
        resp.setId(item.getId());
        resp.setUserId(item.getUserId());
        resp.setProductId(item.getProductId());
        return resp;
    }
}
